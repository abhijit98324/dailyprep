import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Download, Upload } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { PublishStatus } from '../../types';

const REQUIRED_COLUMNS = [
  'exam',
  'subject',
  'topic',
  'difficulty',
  'question',
  'optionA',
  'optionB',
  'optionC',
  'optionD',
  'correctOption',
  'explanation',
  'language',
] as const;

interface ParsedQuestionRow {
  examId: string;
  subject: string;
  topic: string;
  difficulty: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
  language: string;
  status: PublishStatus;
}

export default function BulkUpload({ onUploaded }: { onUploaded: () => void }) {
  const [validRows, setValidRows] = useState<ParsedQuestionRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<PublishStatus>('published');
  const [uploading, setUploading] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');

  const downloadTemplate = () => {
    const sample = [
      {
        exam: 'ssc',
        subject: 'Quantitative Aptitude',
        topic: 'Percentage',
        difficulty: 'medium',
        question: 'What is 25% of 400?',
        optionA: '50',
        optionB: '100',
        optionC: '150',
        optionD: '200',
        correctOption: 'B',
        explanation: '25/100 * 400 = 100.',
        language: 'English',
      },
    ];
    const csv = Papa.unparse(sample);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dailyprep_questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateRows = (rows: Record<string, unknown>[]) => {
    const rowErrors: string[] = [];
    const cleaned: ParsedQuestionRow[] = [];

    rows.forEach((row, i) => {
      const lineNo = i + 2;
      const missing = REQUIRED_COLUMNS.filter((col) => !String(row[col] ?? '').trim());
      if (missing.length) {
        rowErrors.push(`Row ${lineNo}: Missing column(s): ${missing.join(', ')}`);
        return;
      }

      const correct = String(row.correctOption).trim().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(correct)) {
        rowErrors.push(
          `Row ${lineNo}: correctOption must be A, B, C, or D (got "${row.correctOption}")`
        );
        return;
      }

      const diff = String(row.difficulty).trim().toLowerCase();
      if (!['easy', 'medium', 'hard'].includes(diff)) {
        rowErrors.push(`Row ${lineNo}: difficulty must be easy, medium, or hard`);
        return;
      }

      const lang = String(row.language).trim();
      if (!['English', 'Hindi', 'Bengali'].includes(lang)) {
        rowErrors.push(`Row ${lineNo}: language must be English, Hindi, or Bengali`);
        return;
      }

      cleaned.push({
        examId: String(row.exam).trim().toLowerCase(),
        subject: String(row.subject).trim(),
        topic: String(row.topic).trim(),
        difficulty: diff,
        question: String(row.question).trim(),
        optionA: String(row.optionA).trim(),
        optionB: String(row.optionB).trim(),
        optionC: String(row.optionC).trim(),
        optionD: String(row.optionD).trim(),
        correctOption: correct,
        explanation: String(row.explanation).trim(),
        language: lang,
        status,
      });
    });

    setErrors(rowErrors);
    setValidRows(cleaned);
    setDoneMsg('');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.csv')) {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => validateRows(res.data),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        validateRows(json);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleUpload = async () => {
    if (!validRows.length) return;
    setUploading(true);
    try {
      const res = await apiFetch<{ count: number }>('/api/admin/questions/bulk', {
        method: 'POST',
        body: JSON.stringify({
          questions: validRows.map((r) => ({ ...r, status })),
        }),
      });
      setDoneMsg(`Successfully imported ${res.count} questions.`);
      setValidRows([]);
      onUploaded();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Bulk import failed']);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">
            Bulk Upload Questions (CSV / Excel)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Required columns: {REQUIRED_COLUMNS.join(', ')}
          </p>
        </div>

        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold min-h-[44px]"
        >
          <Download className="h-4 w-4" /> Download Template
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold cursor-pointer min-h-[44px]">
          <Upload className="h-4 w-4" /> Choose .csv or .xlsx File
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
        </label>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PublishStatus)}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
        >
          <option value="published">Import as Published</option>
          <option value="draft">Import as Draft</option>
        </select>
      </div>

      {errors.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 max-h-48 overflow-y-auto">
          <p className="font-bold mb-1">Validation Errors ({errors.length}):</p>
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {validRows.length} valid rows ready to import.
          </span>
          <button
            type="button"
            disabled={uploading}
            onClick={handleUpload}
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 min-h-[44px]"
          >
            {uploading ? 'Uploading...' : 'Confirm Upload'}
          </button>
        </div>
      )}

      {doneMsg && (
        <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{doneMsg}</div>
      )}
    </div>
  );
}