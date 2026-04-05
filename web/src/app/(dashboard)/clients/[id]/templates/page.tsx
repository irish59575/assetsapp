"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useClient } from "@/hooks/useClients";
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/hooks/useChecklists";
import type { ChecklistTemplate } from "@/types";

type StepDraft = { title: string; description: string; required: boolean };

function TemplateForm({
  clientId,
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  clientId: number;
  initial?: ChecklistTemplate;
  onSave: (name: string, description: string, steps: StepDraft[]) => void;
  onCancel: () => void;
  isSaving?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [steps, setSteps] = useState<StepDraft[]>(
    initial?.steps.map((s) => ({
      title: s.title,
      description: s.description ?? "",
      required: s.required,
    })) ?? []
  );

  const addStep = () => setSteps((s) => [...s, { title: "", description: "", required: true }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: keyof StepDraft, value: string | boolean) =>
    setSteps((s) => s.map((step, idx) => (idx === i ? { ...step, [field]: value } : step)));
  const moveStep = (i: number, dir: -1 | 1) => {
    const next = [...steps];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setSteps(next);
  };

  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        {initial ? `Editing: ${initial.name}` : "New Template"}
      </h3>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. New Staff Onboarding"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="When to use this template"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Steps <span className="text-gray-400 font-normal">({steps.length})</span>
          </h4>
          <button
            onClick={addStep}
            className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors"
          >
            + Add Step
          </button>
        </div>

        {steps.length === 0 && (
          <p className="text-sm text-gray-400 italic py-4 text-center border border-dashed border-gray-200 rounded-lg">
            No steps yet — click "Add Step" above
          </p>
        )}

        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start bg-gray-50 rounded-lg p-3 border border-gray-100">
              {/* Reorder controls */}
              <div className="flex flex-col items-center gap-0.5 mt-1 w-6 flex-shrink-0">
                <button
                  disabled={i === 0}
                  onClick={() => moveStep(i, -1)}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-[10px] leading-none p-0.5"
                  title="Move up"
                >▲</button>
                <span className="text-xs text-gray-400 font-mono">{i + 1}</span>
                <button
                  disabled={i === steps.length - 1}
                  onClick={() => moveStep(i, 1)}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-[10px] leading-none p-0.5"
                  title="Move down"
                >▼</button>
              </div>

              {/* Step fields */}
              <div className="flex-1 space-y-2 min-w-0">
                <input
                  value={step.title}
                  onChange={(e) => updateStep(i, "title", e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Step title"
                />
                <textarea
                  value={step.description}
                  onChange={(e) => updateStep(i, "description", e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y"
                  placeholder={"Action plan / instructions (one per line, use • for bullets)"}
                />
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={step.required}
                    onChange={(e) => updateStep(i, "required", e.target.checked)}
                    className="rounded"
                  />
                  Required step
                </label>
              </div>

              <button
                onClick={() => removeStep(i)}
                className="text-red-400 hover:text-red-600 text-sm mt-1 flex-shrink-0 p-1"
                title="Remove step"
              >✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(name, desc, steps)}
          disabled={!name.trim() || isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : initial ? "Save Changes" : "Create Template"}
        </button>
      </div>
    </div>
  );
}

// Wrapper so useUpdateTemplate can receive a dynamic id
function EditFormWrapper({
  template,
  onDone,
}: {
  template: ChecklistTemplate;
  onDone: () => void;
}) {
  const { mutate: update, isPending } = useUpdateTemplate(template.id);

  const handleSave = (name: string, description: string, steps: StepDraft[]) => {
    update(
      {
        name,
        description,
        steps: steps.map((s, i) => ({
          order: i,
          title: s.title,
          description: s.description,
          required: s.required,
        })),
      },
      { onSuccess: onDone }
    );
  };

  return (
    <TemplateForm
      clientId={template.client_id}
      initial={template}
      onSave={handleSave}
      onCancel={onDone}
      isSaving={isPending}
    />
  );
}

export default function TemplatesPage() {
  const params = useParams();
  const clientId = Number(params.id);

  const { data: client } = useClient(clientId);
  const { data: templates = [], isLoading } = useTemplates(clientId);
  const { mutate: createTemplate, isPending: isCreating } = useCreateTemplate();
  const { mutate: deleteTemplate } = useDeleteTemplate();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleCreate = (name: string, description: string, steps: StepDraft[]) => {
    createTemplate(
      {
        client_id: clientId,
        name,
        description,
        steps: steps.map((s, i) => ({
          order: i,
          title: s.title,
          description: s.description,
          required: s.required,
        })),
      },
      { onSuccess: () => setShowCreateForm(false) }
    );
  };

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/clients" className="hover:text-blue-600">Clients</Link>
        <span className="mx-2">/</span>
        <Link href={`/clients/${clientId}`} className="hover:text-blue-600">{client?.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Templates</span>
      </nav>

      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{client?.name}</h2>
          <p className="text-gray-500 mt-1">Checklist Templates</p>
        </div>
        {!showCreateForm && editingId === null && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            + New
          </button>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <Link href={`/clients/${clientId}`} className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">Devices</Link>
        <Link href={`/clients/${clientId}/templates`} className="px-4 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600">Templates</Link>
        <Link href={`/clients/${clientId}/deployments`} className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">Deployments</Link>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-6">
          <TemplateForm
            clientId={clientId}
            onSave={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            isSaving={isCreating}
          />
        </div>
      )}

      {/* Template list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : templates.length === 0 && !showCreateForm ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No templates yet</p>
          <p className="text-sm">Create your first checklist template for {client?.name}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) =>
            editingId === t.id ? (
              <EditFormWrapper key={t.id} template={t} onDone={() => setEditingId(null)} />
            ) : (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200">
                {/* Compact header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left group"
                  >
                    <span className="text-gray-400 text-xs transition-transform group-hover:text-gray-600" style={{ transform: expandedId === t.id ? "rotate(90deg)" : undefined }}>▶</span>
                    <span className="font-semibold text-gray-900 truncate">{t.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{t.steps.length} step{t.steps.length !== 1 ? "s" : ""}</span>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/clients/${clientId}/deployments?start=${t.id}`}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ▶ Start
                    </Link>
                    <button
                      onClick={() => setEditingId(t.id)}
                      className="px-3 py-1.5 border border-blue-200 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${t.name}"?`)) deleteTemplate(t.id); }}
                      className="px-2 py-1.5 border border-red-200 text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Expanded step list */}
                {expandedId === t.id && t.steps.length > 0 && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    {t.description && <p className="text-xs text-gray-500 mb-3">{t.description}</p>}
                    <ol className="space-y-1">
                      {t.steps.map((s, i) => (
                        <li key={s.id} className="flex items-start gap-2 text-sm">
                          <span className="text-gray-400 w-5 flex-shrink-0 text-xs font-mono mt-0.5">{i + 1}.</span>
                          <div className="min-w-0">
                            <span className="text-gray-800 font-medium text-sm">{s.title}</span>
                            {!s.required && <span className="ml-1 text-xs text-gray-400">(optional)</span>}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
