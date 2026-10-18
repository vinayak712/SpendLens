import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import FileUploadZone from '../components/FileUploadZone';
import MerchantClassifyModal from '../components/MerchantClassifyModal';
import { Loader2, Upload, PenLine, CheckCircle, Trash2, Layers } from 'lucide-react';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Card', 'Net Banking', 'Other'];
const CATEGORIES = [
  'Food', 'Grocery', 'Dairy', 'Snacks', 'Beverages', 'Personal Care', 'Household', 'Health',
  'Shopping', 'Medical', 'Fuel', 'Travel', 'Bills', 'Entertainment', 'Electronics', 'Education',
  'Friend', 'Family', 'Rent', 'Loan', 'Salary', 'Gift', 'Other',
];

const emptyForm = {
  merchant: '', amount: '', date: new Date().toISOString().split('T')[0],
  category: '', paymentMethod: 'UPI', merchantType: 'Business', notes: '',
};

export default function AddExpense() {
  const [tab, setTab] = useState('upload'); // 'upload' | 'manual'

  // Upload flow state
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null); // raw extracted response
  const [extractedItems, setExtractedItems] = useState([]); // array of extracted transactions
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');

  // Single form state (for manual or single extraction)
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Merchant classify modal
  const [showClassify, setShowClassify] = useState(false);
  const [pendingMerchant, setPendingMerchant] = useState('');

  // Expand/collapse items section
  const [itemsExpanded, setItemsExpanded] = useState(true);

  const updateForm = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const resetAll = () => {
    setFile(null); setFilePreview(null); setExtractedData(null);
    setExtractedItems([]); setForm(emptyForm); setImageUrl(''); setImagePublicId('');
    setSaved(false);
  };

  // ── Upload flow ────────────────────────────────────────────────
  const handleFileSelect = (f) => {
    setFile(f);
    setFilePreview({ url: URL.createObjectURL(f), name: f.name, type: f.type, size: f.size });
    setExtractedData(null);
    setExtractedItems([]);
    setSaved(false);
    // Auto-trigger upload and AI extraction
    handleUploadAndExtract(f);
  };

  const handleUploadAndExtract = async (targetFile) => {
    const fileToUpload = targetFile || file;
    if (!fileToUpload) return toast.error('Please select a file first');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', fileToUpload);
      const { data } = await api.post('/expenses/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.data.imageUrl);
      setImagePublicId(data.data.imagePublicId);

      const ex = data.data.extracted;
      if (ex) {
        setExtractedData(ex);

        const itemsList = Array.isArray(ex.items) && ex.items.length > 0
          ? ex.items
          : (ex.merchant ? [ex] : []);

        const formattedItems = itemsList.map((item, idx) => ({
          id: idx + '-' + Date.now(),
          name: item.name || item.particulars || item.description || item.item || item.product || `Item ${idx + 1}`,
          quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : 1,
          unitPrice: item.unitPrice !== undefined && item.unitPrice !== null ? item.unitPrice : (item.amount || 0),
          totalPrice: item.totalPrice !== undefined && item.totalPrice !== null ? item.totalPrice : (item.amount || 0),
          category: item.category || 'Grocery',
        }));

        setExtractedItems(formattedItems);

        // Populate top-level receipt form
        setForm({
          merchant: ex.merchant || (itemsList[0]?.merchant) || 'Store',
          amount: ex.total !== null && ex.total !== undefined ? ex.total : (itemsList.reduce((s, i) => s + (parseFloat(i.totalPrice || i.amount) || 0), 0) || ''),
          date: ex.date || emptyForm.date,
          category: ex.category || (itemsList[0]?.category) || 'Grocery',
          paymentMethod: ex.paymentMethod || 'Card',
          merchantType: 'Business',
          notes: ex.discount ? `Saved ₹${ex.discount} on MRP` : '',
        });

        toast.success(`✨ Receipt extracted: ${formattedItems.length} item(s) found!`);

        // Check merchant mapping for top merchant
        if (ex.merchant && !data.data.merchantMapping) {
          setPendingMerchant(ex.merchant);
          setShowClassify(true);
        } else if (data.data.merchantMapping) {
          updateForm('category', data.data.merchantMapping.category);
          updateForm('merchantType', data.data.merchantMapping.merchantType);
        }
      } else if (data.data.extractionError) {
        toast.error(`AI Note: ${data.data.extractionError}`);
        setExtractedData({});
      } else {
        toast('File uploaded. Please fill in expense details below.', { icon: '📄' });
        setExtractedData({});
      }
    } catch (err) {
      console.error('Upload Error:', err);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Item field changes ──
  const updateExtractedItem = (id, key, value) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  };

  const removeExtractedItem = (id) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ── Merchant classification ────────────────────────────────────
  const handleClassifySave = async ({ merchantType, category }) => {
    try {
      await api.post('/merchants', { merchantName: pendingMerchant, merchantType, category });
      setForm((f) => ({ ...f, category, merchantType }));
      setShowClassify(false);
      toast.success('Merchant saved!');
    } catch {
      toast.error('Failed to save merchant mapping');
    }
  };

  // ── Check merchant on manual entry blur ───────────────────────
  const handleMerchantBlur = async () => {
    if (!form.merchant || tab !== 'manual') return;
    try {
      const { data } = await api.get(`/merchants/check?name=${encodeURIComponent(form.merchant)}`);
      if (data.found) {
        updateForm('category', data.mapping.category);
        updateForm('merchantType', data.mapping.merchantType);
      } else {
        setPendingMerchant(form.merchant);
        setShowClassify(true);
      }
    } catch {}
  };

  // ── Save expense ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.merchant) return toast.error('Merchant is required');
    if (!form.amount || isNaN(form.amount)) return toast.error('Valid total amount is required');
    if (!form.category) return toast.error('Category is required');

    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        items: extractedItems.map((item) => ({
          name: item.name,
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          totalPrice: parseFloat(item.totalPrice) || 0,
          category: item.category || 'Other',
        })),
        ...(extractedData && {
          subtotal: extractedData.subtotal,
          tax: extractedData.tax,
          discount: extractedData.discount,
          confidence: extractedData.confidence || 'high',
        }),
        ...(tab === 'upload' && { imageUrl, imagePublicId, source: 'upload' }),
      };

      await api.post('/expenses/save-extracted', payload);
      toast.success('🎉 Expense saved successfully!');
      setSaved(true);
      resetAll();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const showForm = tab === 'manual' || (tab === 'upload' && (extractedData || imageUrl));

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* Tabs */}
      <div className="flex gap-1 bg-surface-mid p-1 rounded-lg mb-6 w-fit">
        {[{ id: 'upload', icon: Upload, label: 'Upload Statement / Receipt' }, { id: 'manual', icon: PenLine, label: 'Manual Entry' }].map(
          ({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setTab(id); resetAll(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === id ? 'bg-white text-primary-600 shadow-card' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          )
        )}
      </div>

      <div className="card space-y-5">
        {/* ── Upload tab ── */}
        {tab === 'upload' && (
          <>
            <FileUploadZone
              onFileSelect={handleFileSelect}
              preview={filePreview}
              onClear={resetAll}
            />
            {uploading && (
              <div className="flex items-center justify-center gap-2 p-3 bg-primary-50 text-primary-700 rounded-lg font-medium text-sm border border-primary-200">
                <Loader2 size={18} className="animate-spin text-primary-600" />
                <span>🤖 Gemini AI is scanning receipt and extracting line items...</span>
              </div>
            )}
            {extractedData && !uploading && (
              <div className="flex items-center gap-2 text-sm text-success font-medium bg-green-50 p-3 rounded-lg border border-green-200">
                <CheckCircle size={16} /> Receipt analyzed! 1 transaction ready with {extractedItems.length} nested item(s).
              </div>
            )}
          </>
        )}

        {/* ── Review & Edit Form ── */}
        {showForm && (
          <div className="space-y-5 border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-ink">
              {tab === 'upload' ? 'Review Extracted Receipt' : 'Enter Expense Details'}
            </h3>

            {/* Top-level receipt fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Store / Merchant</label>
                <input
                  className="input"
                  placeholder="e.g. DMart, Swiggy"
                  value={form.merchant}
                  onChange={(e) => updateForm('merchant', e.target.value)}
                  onBlur={handleMerchantBlur}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Total Amount (₹)</label>
                <input
                  className="input font-bold text-ink"
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => updateForm('amount', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  className="input"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateForm('date', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Primary Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => updateForm('category', e.target.value)}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select
                  className="input"
                  value={form.paymentMethod}
                  onChange={(e) => updateForm('paymentMethod', e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Merchant Type</label>
                <select
                  className="input"
                  value={form.merchantType}
                  onChange={(e) => updateForm('merchantType', e.target.value)}
                >
                  <option value="Business">Business</option>
                  <option value="Person">Person</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Notes / Reference</label>
                <input
                  className="input"
                  placeholder="Transaction note, savings, invoice #, etc."
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                />
              </div>
            </div>

            {/* ── Expandable / Collapsible Line Items Section ── */}
            {extractedItems.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setItemsExpanded(!itemsExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200/70 transition-colors text-left font-medium text-xs text-ink"
                >
                  <span className="flex items-center gap-2">
                    <Layers size={15} className="text-primary-600" />
                    <strong>Itemized Line Items ({extractedItems.length})</strong>
                    <span className="text-ink-muted text-[11px]">— categorized individually</span>
                  </span>
                  <span className="text-primary-600 text-xs font-semibold">
                    {itemsExpanded ? 'Hide Items ▲' : 'Show Items ▼'}
                  </span>
                </button>

                {itemsExpanded && (
                  <div className="p-3 space-y-2.5 max-h-[350px] overflow-y-auto">
                    {extractedItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-white p-2.5 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs shadow-2xs"
                      >
                        <div className="sm:col-span-5">
                          <input
                            className="input py-1 text-xs"
                            placeholder="Item Name"
                            value={item.name || ''}
                            onChange={(e) => updateExtractedItem(item.id, 'name', e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            className="input py-1 text-xs"
                            type="number"
                            placeholder="Qty"
                            value={item.quantity !== undefined ? item.quantity : 1}
                            onChange={(e) => updateExtractedItem(item.id, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            className="input py-1 text-xs font-semibold text-ink"
                            type="number"
                            placeholder="Price ₹"
                            value={item.totalPrice !== undefined ? item.totalPrice : ''}
                            onChange={(e) => updateExtractedItem(item.id, 'totalPrice', e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <select
                            className="input py-1 text-xs"
                            value={item.category}
                            onChange={(e) => updateExtractedItem(item.id, 'category', e.target.value)}
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeExtractedItem(item.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Remove line item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Single Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold shadow-md"
            >
              {saved ? (
                <><CheckCircle size={18} /> Expense Saved!</>
              ) : saving ? (
                <><Loader2 size={18} className="animate-spin" /> Saving Expense...</>
              ) : (
                'Save Expense'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Merchant classify modal */}
      {showClassify && (
        <MerchantClassifyModal
          merchantName={pendingMerchant}
          onSave={handleClassifySave}
          onClose={() => setShowClassify(false)}
        />
      )}
    </div>
  );
}
