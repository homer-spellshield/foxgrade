import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Plus, Upload, X, MoreVertical } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  category: string;
  access_level: string;
  expiry_date: string | null;
  file_path: string;
  created_at: string;
}

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [category, setCategory] = useState('Policy');
  const [accessLevel, setAccessLevel] = useState('Public');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadDocs() {
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();
      if (profile?.org_id) {
        setOrgId(profile.org_id);
        const { data: docs } = await supabase.from('documents').select('*').eq('org_id', profile.org_id).order('created_at', { ascending: false });
        if (docs) setDocuments(docs);
      }
      setLoading(false);
    }
    loadDocs();
  }, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !orgId) return;
    
    setUploading(true);
    try {
      // 1. Upload file to Supabase Storage (assuming 'documents' bucket exists)
      const fileExt = file.name.split('.').pop();
      const fileName = `${orgId}/${Math.random()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Insert record into DB
      const { data: insertData, error: insertError } = await supabase.from('documents').insert({
        org_id: orgId,
        name: docName,
        category,
        access_level: accessLevel,
        file_path: uploadData.path,
        expiry_date: expiryDate || null
      }).select().single();

      if (insertError) throw insertError;

      setDocuments([insertData, ...documents]);
      setShowUpload(false);
      resetForm();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}. Please ensure the 'documents' storage bucket exists in your Supabase project.`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setDocName('');
    setCategory('Policy');
    setAccessLevel('Public');
    setExpiryDate('');
  };

  const getStatus = (dateStr: string | null) => {
    if (!dateStr) return { color: 'bg-emerald-500', text: 'Current' };
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    
    if (days < 0) return { color: 'bg-red-500', text: 'Expired' };
    if (days <= 90) return { color: 'bg-amber-500', text: `Expiring in ${days}d` };
    return { color: 'bg-emerald-500', text: 'Current' };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-slate-900 mb-1">Documents</h1>
          <p className="text-slate-600">Manage your published security and compliance documents.</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="bg-[#1A3D2E] hover:bg-[#1A3D2E]/90 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </button>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No documents yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm">Upload your first compliance policy or certificate to feature it on your Trust Centre.</p>
            <button 
              onClick={() => setShowUpload(true)}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Upload Document
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Document Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Access Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {documents.map((doc) => {
                const status = getStatus(doc.expiry_date);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-slate-400 mr-3" />
                        <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{doc.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-700 border-slate-200">
                        {doc.access_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${status.color}`}></div>
                        <span className="text-sm text-slate-700">{status.text}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-5 h-5 inline-block" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-medium text-slate-900">Upload Document</h3>
              <button onClick={() => { setShowUpload(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:bg-slate-50 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#1A3D2E] hover:underline focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#1A3D2E]">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setFile(f);
                            if (!docName) setDocName(f.name.split('.')[0]);
                          }
                        }} required />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">
                      {file ? file.name : "PDF, DOCX up to 10MB"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
                <input type="text" value={docName} onChange={(e) => setDocName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2E]/20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                    <option>Policy</option>
                    <option>Certificate</option>
                    <option>Report</option>
                    <option>Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Access Level</label>
                  <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                    <option>Public</option>
                    <option>Registered</option>
                    <option>NDA Required</option>
                    <option>Request Access</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2E]/20" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => { setShowUpload(false); resetForm(); }} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={uploading || !file} className="px-4 py-2 bg-[#1A3D2E] text-white rounded-md text-sm font-medium hover:bg-[#1A3D2E]/90 disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
