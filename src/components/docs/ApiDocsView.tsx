import React, { useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { swaggerDocument } from '../../swagger/swaggerDocument';
import {
  FileCode2,
  ExternalLink,
  Copy,
  Check,
  Download,
  BookOpen,
  Server,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const copySpec = () => {
    navigator.clipboard.writeText(JSON.stringify(swaggerDocument, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSpec = () => {
    const blob = new Blob([JSON.stringify(swaggerDocument, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'didar-openapi-spec.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 select-none" id="api-docs-view">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-[#1E2E50] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-colors">
        <div className="space-y-2 text-right">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Swagger / OpenAPI 3.0</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] border border-blue-200/60 dark:border-blue-800/40">
              <Server className="w-3.5 h-3.5" />
              <span>پلتفرم چندمستأجره دیدار</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            مستندات تعاملی API و وب‌سرویس‌ها (Swagger)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
            راهنمای کامل اندپوینت‌های REST پلتفرم دیدار شامل احراز هویت JWT، مدیریت چندسازمانی (Multi-Tenancy)، رزرواسیون اتاق‌ها، کاربران، سطوح دسترسی RBAC و آمار سیستم.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-xs transition-colors cursor-pointer"
          >
            <span>مشاهده در تب مجزا</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={copySpec}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#16243F] hover:bg-slate-200 dark:hover:bg-[#1E2E50] border border-slate-200/60 dark:border-[#1E2E50] transition-colors cursor-pointer"
            title="کپی JSON فایل مشخصات OpenAPI"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد' : 'کپی JSON'}</span>
          </button>

          <button
            onClick={downloadSpec}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#16243F] hover:bg-slate-200 dark:hover:bg-[#1E2E50] border border-slate-200/60 dark:border-[#1E2E50] transition-colors cursor-pointer"
            title="دانلود فایل OpenAPI Spec"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل</span>
          </button>
        </div>
      </div>

      {/* Feature Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111A2E] border border-slate-200/70 dark:border-[#1E2E50] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-right">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              احراز هویت با JWT
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              پشتیبانی از هدر Bearer Token در تمام درخواست‌ها
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111A2E] border border-slate-200/70 dark:border-[#1E2E50] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div className="text-right">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              معماری Multi-Tenant
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              تفکیک داده‌ها بر اساس Organization ID یا ساب‌دامین
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111A2E] border border-slate-200/70 dark:border-[#1E2E50] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-right">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              تست تعاملی زنده
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              قابلیت Try it out و ارسال تست مستقیم روی سرور
            </p>
          </div>
        </div>
      </div>

      {/* Embedded Swagger UI Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-[#1E2E50] rounded-3xl p-4 sm:p-6 shadow-xs overflow-hidden">
        <div className="swagger-wrapper ltr text-left bg-white dark:bg-slate-900 rounded-2xl" dir="ltr">
          <SwaggerUI
            spec={swaggerDocument}
            docExpansion="list"
            filter={true}
            displayOperationId={false}
          />
        </div>
      </div>
    </div>
  );
};
