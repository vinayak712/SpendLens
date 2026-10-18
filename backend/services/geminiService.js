import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const candidateModels = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.6-pro',
];

/**
 * Execute generateContent trying candidate models with retries on 503/transient errors
 */
const generateContentWithFallback = async (contentPayload, maxRetries = 2) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not configured in backend/.env. Please set a valid Gemini API key.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(contentPayload);
        return result;
      } catch (err) {
        lastError = err;
        const isTransient = err.message && (err.message.includes('503') || err.message.includes('fetch failed') || err.message.includes('high demand'));
        console.warn(`⚠️ Model ${modelName} error (${err.message || 'unknown error'}). ${isTransient ? 'Retrying with next model...' : ''}`);
        if (isTransient) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
        continue;
      }
    }
    // If all models hit transient issues, wait 1.5s before entire candidate retry cycle
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw lastError;
};

/**
 * Extract structured expense data from an image URL using Gemini Vision
 * @param {string} imageUrl - Cloudinary URL of uploaded receipt/screenshot
 * @param {string} mimeType - MIME type of image (default: image/jpeg)
 * @returns {Promise<Object>} - Extracted expense fields
 */
export const extractExpenseFromImage = async (imageUrl, mimeType = 'image/jpeg') => {
  // Fetch image as base64
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString('base64');

  const prompt = `You are a receipt and financial document data extraction engine. Analyze this receipt image, UPI payment screenshot (Google Pay, PhonePe, Paytm, etc.), or bank statement and extract ALL individual line items and transaction details, even if the receipt is faded, tilted, or has a long list.

Return ONLY valid JSON in exactly this structure — no markdown, no code fences, no explanation text before or after:
{
  "merchant": "merchant or store name (string)",
  "date": "YYYY-MM-DD",
  "paymentMethod": "Cash | UPI | Credit Card | Debit Card | Net Banking | Card | Other",
  "items": [
    {
      "name": "item or product name (string)",
      "quantity": 1,
      "unitPrice": 0,
      "totalPrice": 0,
      "category": "Grocery | Dairy | Personal Care | Household | Snacks | Beverages | Health | Food | Shopping | Other"
    }
  ],
  "subtotal": 0,
  "tax": 0,
  "discount": 0,
  "total": 0,
  "confidence": "high"
}

Rules:
1. Extract EVERY line item visible on the receipt or statement, not just a summary. A receipt with 15 items must return 15 entries in "items", not one merged entry.
2. Categorize EACH item individually based on its name, choosing from: Grocery, Dairy, Personal Care, Household, Snacks, Beverages, Health, Food, Shopping, Other. Do not assign one category to the whole receipt.
3. If an item name is abbreviated or unclear (e.g. "MILKY MIST SKYR-225g"), infer the most likely full product and category from context.
4. If quantity or unit price isn't clearly printed, calculate it from totalPrice when possible, otherwise default quantity to 1.
5. If the image is too blurry/faded to read a specific item confidently, still include your best guess for that item, and set "confidence" to "low" for the whole receipt.
6. Ignore GST/tax breakdown lines (like "CGST 2.50%") as line items — those go into the "tax" field, not "items".
7. For UPI transaction lists / bank statements, extract each transaction entry into the "items" array with merchant name and amount.
8. Do not skip items just because the print is faint — try harder before omitting.
9. Return ONLY pure valid JSON.`;

  const result = await generateContentWithFallback([
    { inlineData: { mimeType, data: base64Image } },
    { text: prompt },
  ]);

  const text = result.response.text().trim();

  // Clean response — remove markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (e) {
        console.error('Failed secondary JSON regex parse:', e);
      }
    }
  }

  if (!parsed) {
    throw new Error('Failed to parse expense data from image');
  }

  // Normalize structure so items is always an array
  let items = [];
  if (Array.isArray(parsed.items) && parsed.items.length > 0) {
    items = parsed.items.map((item) => {
      const amount = typeof item.totalPrice === 'number'
        ? item.totalPrice
        : typeof item.amount === 'number'
          ? item.amount
          : parseFloat(String(item.totalPrice || item.amount || 0).replace(/,/g, '')) || 0;

      const unitPrice = typeof item.unitPrice === 'number'
        ? item.unitPrice
        : parseFloat(String(item.unitPrice || 0).replace(/,/g, '')) || amount;

      const quantity = typeof item.quantity === 'number'
        ? item.quantity
        : parseFloat(String(item.quantity || 1)) || 1;

      const itemName = item.name || item.merchant || 'Item';
      return {
        merchant: parsed.merchant || item.merchant || itemName,
        name: itemName,
        amount,
        quantity,
        unitPrice,
        totalPrice: amount,
        category: item.category || 'Other',
        date: parsed.date || item.date || new Date().toISOString().split('T')[0],
        paymentMethod: parsed.paymentMethod || item.paymentMethod || 'UPI',
        notes: item.notes || (item.name ? `${item.name}${quantity > 1 ? ` (Qty: ${quantity})` : ''}` : ''),
      };
    });
  } else if (Array.isArray(parsed)) {
    items = parsed.map((item) => ({
      merchant: item.merchant || item.name || 'Expense',
      name: item.name || item.merchant || 'Item',
      amount: typeof item.totalPrice === 'number'
        ? item.totalPrice
        : typeof item.amount === 'number'
          ? item.amount
          : parseFloat(String(item.amount || item.totalPrice || 0).replace(/,/g, '')) || 0,
      category: item.category || 'Other',
      date: item.date || new Date().toISOString().split('T')[0],
      paymentMethod: item.paymentMethod || 'UPI',
      notes: item.notes || '',
    }));
  } else if (parsed.merchant || parsed.total || parsed.amount) {
    const totalAmount = parsed.total ?? parsed.amount ?? 0;
    items = [{
      merchant: parsed.merchant || 'Unknown Merchant',
      name: parsed.merchant || 'Expense',
      amount: typeof totalAmount === 'number' ? totalAmount : parseFloat(String(totalAmount).replace(/,/g, '')) || 0,
      date: parsed.date || new Date().toISOString().split('T')[0],
      paymentMethod: parsed.paymentMethod || 'UPI',
      category: parsed.category || 'Other',
      notes: '',
    }];
  }

  const calculatedTotal = items.reduce((sum, i) => sum + (i.amount || 0), 0);

  return {
    merchant: parsed.merchant || items[0]?.merchant || 'Unknown Merchant',
    date: parsed.date || items[0]?.date || new Date().toISOString().split('T')[0],
    paymentMethod: parsed.paymentMethod || items[0]?.paymentMethod || 'UPI',
    subtotal: typeof parsed.subtotal === 'number' ? parsed.subtotal : null,
    tax: typeof parsed.tax === 'number' ? parsed.tax : null,
    discount: typeof parsed.discount === 'number' ? parsed.discount : null,
    total: typeof parsed.total === 'number' ? parsed.total : calculatedTotal,
    confidence: parsed.confidence || 'high',
    items,
    ...(items[0] || {}),
  };
};

/**
 * Generate AI financial insights by asking Gemini about expenses
 * @param {Array} expenses - Array of expense objects
 * @param {string} question - User's natural language question
 * @param {Object} user - User info (name, monthlyBudget, currency)
 * @returns {Promise<string>} - AI generated answer
 */
export const generateInsights = async (expenses, question, user) => {
  // Summarize expenses for context (avoid huge token usage)
  const summary = expenses.slice(0, 100).map((e) => ({
    merchant: e.merchant,
    amount: e.amount,
    date: e.date,
    category: e.category,
    paymentMethod: e.paymentMethod,
  }));

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const prompt = `You are SpendLens AI, a smart personal finance advisor. 

User: ${user.name}
Monthly Budget: ₹${user.monthlyBudget || 'Not set'}
Total expenses in dataset: ${expenses.length}
Total spent: ₹${totalSpent.toLocaleString('en-IN')}
Current month: ${currentMonth}

Recent expense data (JSON):
${JSON.stringify(summary, null, 2)}

User's question: "${question}"

Instructions:
- Give a clear, concise, helpful response
- Use ₹ for Indian Rupees
- Format amounts with Indian number system (e.g., ₹1,23,456)
- Provide actionable insights when possible
- If comparing months, be specific with numbers
- Keep response under 250 words
- Use bullet points for multiple insights`;

  const result = await generateContentWithFallback(prompt);
  return result.response.text();
};

/**
 * Generate automatic dashboard insights from recent expenses
 * @param {Array} expenses - Recent expense objects
 * @param {Object} user - User info
 * @returns {Promise<string>}
 */
export const generateDashboardInsights = async (expenses, user) => {
  const question =
    'Analyze my recent spending patterns. Highlight the top spending categories, any unusual expenses, and give 3 actionable tips to save money this month.';
  return generateInsights(expenses, question, user);
};
