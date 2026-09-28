import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, Copy, Check, ExternalLink, Code } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, testSupabaseConnection } from '../data/api';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const SQL_SCHEMA_SCRIPT = `-- SQL Setup Script for J.H. Cerilles State College Compliance Database
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

CREATE TABLE IF NOT EXISTS campuses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  programs_count INT DEFAULT 0,
  percent INT DEFAULT 0,
  complied INT DEFAULT 0,
  total INT DEFAULT 0,
  campus_filter TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  degree_type TEXT NOT NULL,
  campus TEXT NOT NULL,
  cmo_reference TEXT NOT NULL,
  status TEXT NOT NULL,
  overall_score INT DEFAULT 0,
  total_checks INT DEFAULT 0,
  passed_checks INT DEFAULT 0,
  cmo_url TEXT
);

CREATE TABLE IF NOT EXISTS institutional_forms (
  id TEXT PRIMARY KEY,
  form_code TEXT NOT NULL,
  form_name TEXT NOT NULL,
  category TEXT NOT NULL,
  total_items INT DEFAULT 0,
  complied_items INT DEFAULT 0,
  is_open BOOLEAN DEFAULT true,
  href TEXT
);

CREATE TABLE IF NOT EXISTS form1_program_offerings (
  id TEXT PRIMARY KEY,
  program_name TEXT NOT NULL,
  campus TEXT NOT NULL,
  copc_status TEXT NOT NULL,
  enrollment_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS form2_faculty_profiles (
  id TEXT PRIMARY KEY,
  campus TEXT NOT NULL,
  total_faculty INT DEFAULT 0,
  phd_holders INT DEFAULT 0,
  ms_holders INT DEFAULT 0,
  full_time INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS form3_research_outputs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  journal TEXT NOT NULL,
  year INT NOT NULL,
  campus TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS form4_research_expenditures (
  id TEXT PRIMARY KEY,
  fiscal_year INT NOT NULL,
  amount_php NUMERIC DEFAULT 0,
  funding_source TEXT NOT NULL,
  campus TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_links (
  id TEXT PRIMARY KEY,
  form_code TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  file_type TEXT DEFAULT 'PDF'
);

-- Seed Initial Campus Baseline Data
INSERT INTO campuses (id, name, programs_count, percent, complied, total, campus_filter) VALUES
  ('main', 'Main Campus (Mati)', 21, 80, 278, 349, 'Main'),
  ('dumingag', 'Dumingag Campus', 12, 84, 184, 218, 'Dumingag'),
  ('pagadian', 'Pagadian Annex', 5, 90, 85, 94, 'Pagadian'),
  ('lakewood', 'CMSE (Lakewood)', 5, 65, 51, 78, 'Lakewood')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Programs
INSERT INTO programs (id, title, degree_type, campus, cmo_reference, status, overall_score, total_checks, passed_checks, cmo_url) VALUES
  ('bsit', 'BS Information Technology', 'Undergraduate', 'Main', 'CMO No. 25, s. 2015', 'Complied', 92, 25, 23, 'https://ched.gov.ph'),
  ('bsa', 'BS Agriculture', 'Undergraduate', 'Dumingag', 'CMO No. 14, s. 2019', 'Complied', 88, 25, 22, 'https://ched.gov.ph'),
  ('bscs', 'BS Computer Science', 'Undergraduate', 'Pagadian', 'CMO No. 25, s. 2015', 'Complied', 90, 20, 18, 'https://ched.gov.ph'),
  ('bsf', 'BS Forestry', 'Undergraduate', 'Lakewood', 'CMO No. 44, s. 2017', 'In Progress', 68, 22, 15, 'https://ched.gov.ph')
ON CONFLICT (id) DO NOTHING;
`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose, onConnected }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [schema, setSchema] = useState('public');
  const [activeTab, setActiveTab] = useState<'connect' | 'sql'>('connect');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string; tables?: string[] } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentConfig = getSupabaseConfig();
      setUrl(currentConfig.url);
      setKey(currentConfig.key);
      setSchema(currentConfig.schema || 'public');
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setLoading(true);
    setStatusMessage(null);
    const result = await testSupabaseConnection(url, key, schema);
    setLoading(false);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: result.message,
        tables: result.tablesFound,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message,
      });
    }
  };

  const handleSave = () => {
    if (!url.trim() || !key.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter both Supabase URL and Anon Key.' });
      return;
    }

    saveSupabaseConfig({
      url: url.trim(),
      key: key.trim(),
      schema: schema.trim() || 'public',
    });

    setStatusMessage({ type: 'success', text: 'Supabase credentials saved successfully!' });
    if (onConnected) onConnected();
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setKey('');
    setSchema('public');
    setStatusMessage({ type: 'info', text: 'Disconnected from custom Supabase instance. Using fallback mock dataset.' });
    if (onConnected) onConnected();
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-signature border border-[#E5E9E2] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-[#0E3322] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8AE1F]/20 flex items-center justify-center text-[#E8AE1F]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl leading-tight text-[#F5F2E6]">
                Supabase Database Connection
              </h2>
              <p className="text-xs text-[#F5F2E6]/75 mt-0.5">
                Connect live Supabase database for CHED compliance records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E5E9E2] bg-[#FBFBF9] px-6 pt-3 gap-6">
          <button
            onClick={() => setActiveTab('connect')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'connect'
                ? 'border-[#1E4D2B] text-[#1E4D2B]'
                : 'border-transparent text-[#64748B] hover:text-[#15221A]'
            }`}
          >
            <Database className="w-4 h-4" />
            Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sql'
                ? 'border-[#1E4D2B] text-[#1E4D2B]'
                : 'border-transparent text-[#64748B] hover:text-[#15221A]'
            }`}
          >
            <Code className="w-4 h-4" />
            Database Setup Script (SQL)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {activeTab === 'connect' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#15221A] uppercase tracking-wider mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] text-sm text-[#15221A] focus:outline-none focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#15221A] uppercase tracking-wider mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] text-sm text-[#15221A] focus:outline-none focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#15221A] uppercase tracking-wider mb-1">
                  Database Schema
                </label>
                <input
                  type="text"
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                  placeholder="public or ched_public"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] text-sm text-[#15221A] focus:outline-none focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent"
                />
                <p className="text-xs text-[#64748B] mt-1">
                  Default schema is <code className="bg-[#F1F5F9] px-1 py-0.5 rounded text-[#0F172A]">public</code>.
                  The app automatically falls back across schemas if tables are present.
                </p>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm border flex items-start gap-3 ${
                    statusMessage.type === 'success'
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                      : statusMessage.type === 'error'
                      ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                      : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-[#16A34A] mt-0.5" />
                  ) : statusMessage.type === 'error' ? (
                    <AlertCircle className="w-5 h-5 shrink-0 text-[#DC2626] mt-0.5" />
                  ) : (
                    <RefreshCw className="w-5 h-5 shrink-0 text-[#2563EB] mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{statusMessage.text}</p>
                    {statusMessage.tables && statusMessage.tables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {statusMessage.tables.map((tbl) => (
                          <span
                            key={tbl}
                            className="bg-white px-2 py-0.5 rounded border border-[#BBF7D0] text-[11px] font-mono font-semibold text-[#15803D]"
                          >
                            ✓ {tbl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E9E2]">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3.5 py-2 text-xs font-semibold text-[#64748B] hover:text-[#DC2626] transition-colors"
                >
                  Clear Saved Credentials
                </button>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] active:scale-95 text-[#1E293B] font-bold text-xs rounded-lg transition-all"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    )}
                    Test Connection
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0E3322] hover:bg-[#154630] active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                  >
                    Save & Connect
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#475569]">
                  If your Supabase project is empty, copy this SQL script and paste it into your{' '}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1E4D2B] underline font-semibold inline-flex items-center gap-0.5"
                  >
                    Supabase SQL Editor <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  to generate initial compliance tables and sample records.
                </p>
                <button
                  onClick={copySqlToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0E3322] text-white text-xs font-bold rounded-lg hover:bg-[#154630] transition-colors shrink-0"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-[#E8AE1F]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copied!' : 'Copy SQL Script'}
                </button>
              </div>

              <div className="relative bg-[#0F172A] text-[#F8FAFC] rounded-xl p-4 font-mono text-xs max-h-80 overflow-y-auto no-scrollbar border border-[#334155]">
                <pre>{SQL_SCHEMA_SCRIPT}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
