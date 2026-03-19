import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Save } from 'lucide-react';

export default function Editor() {
  const { user } = useAuth();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-slate-900 mb-1">Trust Centre Editor</h1>
          <p className="text-slate-600">Update your public security posture and FAQs.</p>
        </div>
        <button className="bg-[#1A3D2E] hover:bg-[#1A3D2E]/90 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </button>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <p className="text-slate-500">Live editor functionality coming soon. Currently managed via the Onboarding Wizard.</p>
      </div>
    </div>
  );
}
