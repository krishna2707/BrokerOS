// ============================================================================
// BrokerOS — Email Flow Canvas Builder View (Full WhatsApp Visual Parity)
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { EmailFlow, CampaignItem } from '@/features/marketing/types';
import type { EmailFlowNodeType, EmailFlowNode } from './builder/types';
import { EMAIL_NODE_TYPES_META } from './builder/types';
import { FlowNodeCard } from './builder/FlowNodeCard';
import {
  EmailFlowHeaderBar,
  EmailFlowTriggerConfigCard,
  EmailFlowSimulationModal,
} from './builder-view';

interface EmailFlowBuilderViewProps {
  id: string;
}

export function EmailFlowBuilderView({ id }: EmailFlowBuilderViewProps) {
  const [flow, setFlow] = useState<EmailFlow | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'active'>('draft');
  const [triggerType, setTriggerType] = useState<'keyword_match' | 'any_reply'>('keyword_match');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [nodes, setNodes] = useState<EmailFlowNode[]>([]);
  const [existingTags, setExistingTags] = useState<{ id: string; name: string; color: string }[]>([]);

  // Simulation test state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testInput, setTestInput] = useState('Can you send the pricing sheet and when can I visit the sample flat?');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load Flow
        const res = await fetch(`${baseUrl}/api/marketing/email/flows/${id}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Flow not found');
        const data: EmailFlow = await res.json();
        setFlow(data);
        setName(data.name || '');
        setDescription(data.description || '');
        setStatus((data.status as any) || 'draft');
        setTriggerType(data.triggerType === 'any_reply' ? 'any_reply' : 'keyword_match');
        setKeywords(data.triggerConfig?.keywords || []);
        setIsGlobal(data.isGlobal ?? true);
        setSelectedCampaignIds(data.campaignIds || []);

        // Normalize and prune legacy nodeType aliases to current standard types
        const rawNodes: any[] = data.nodes || [];
        const normalizedNodes: EmailFlowNode[] = rawNodes
          .filter(
            (n) =>
              n.nodeType !== 'update_lead' &&
              n.nodeType !== 'human_handoff' &&
              n.nodeType !== 'pre_sales_handoff',
          )
          .map((n, idx) => {
            let nodeType = n.nodeType as EmailFlowNodeType;
            if (n.nodeType === 'ai_reply') nodeType = 'ai_agent';
            else if (!EMAIL_NODE_TYPES_META[nodeType]) nodeType = 'send_email';

            return {
              id: n.id,
              nodeKey: n.nodeKey || `node_${Date.now().toString(36)}_${idx}`,
              nodeType,
              config: n.config || {},
              branches: n.branches || n.config?.branches || (nodeType === 'condition' ? { yes: [], no: [] } : undefined),
              positionX: n.positionX ?? 100,
              positionY: n.positionY ?? (idx + 1) * 120,
            };
          });
        setNodes(normalizedNodes);

        // Load active campaigns for scoping
        const campRes = await fetch(`${baseUrl}/api/marketing/campaigns`, {
          credentials: 'include',
        });
        if (campRes.ok) {
          const campData = await campRes.json();
          setCampaigns(campData.items || []);
        }

        // Load CRM Tags from settings
        const tagsRes = await fetch(`${baseUrl}/api/marketing/email/tags`, {
          credentials: 'include',
        });
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          if (Array.isArray(tagsData)) setExistingTags(tagsData);
        }
      } catch (err: any) {
        toast.error(err.message || 'Error loading flow details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, baseUrl]);

  const handleAddKeyword = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = newKeyword.trim().toLowerCase();
    if (!clean || keywords.includes(clean)) return;
    setKeywords([...keywords, clean]);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleAddNode = (type: EmailFlowNodeType) => {
    const key = `${type}_${Date.now().toString(36).slice(-4)}`;
    let defaultConfig: Record<string, any> = {};

    switch (type) {
      case 'start':
        defaultConfig = {};
        break;
      case 'send_email':
        defaultConfig = {
          subject: 'Re: Inquiring about {{projectName}}',
          bodyHtml: '<p>Hi {{firstName}},</p><p>Thank you for reaching out regarding {{projectName}}. We would be delighted to assist you with the brochure and floor plans.</p><p>Best regards,<br/>Skyline Realty Team</p>',
        };
        break;
      case 'ai_agent':
        defaultConfig = {
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          instructions: 'Respond courteously and professionally, answering property pricing and scheduling queries, and offer to schedule an in-person site visit.',
          maxTurns: 3,
          stopIfHumanActive: true,
          handoffOnMax: true,
        };
        break;
      case 'condition':
        defaultConfig = {
          criteriaType: 'keywords',
          keywords: 'visit, price, cost, schedule, brochure',
          branches: { yes: [], no: [] },
        };
        break;
      case 'add_tag':
        defaultConfig = {
          tagName: existingTags[0]?.name || 'INTERESTED_VISIT',
          color: existingTags[0]?.color || '#8B5CF6',
        };
        break;
      case 'end':
        defaultConfig = {};
        break;
    }

    const newNode: EmailFlowNode = {
      nodeKey: key,
      nodeType: type,
      config: defaultConfig,
      branches: type === 'condition' ? { yes: [], no: [] } : undefined,
      positionX: 100,
      positionY: (nodes.length + 1) * 120,
    };

    setNodes([...nodes, newNode]);
    toast.success(`Added ${EMAIL_NODE_TYPES_META[type]?.label || type} step`);
  };

  const handleUpdateNodeConfig = (nodeKey: string, configPatch: Record<string, any>) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.nodeKey !== nodeKey) return n;
        const updatedConfig = { ...n.config, ...configPatch };
        const updatedBranches = configPatch.branches !== undefined ? configPatch.branches : n.branches;
        return {
          ...n,
          config: updatedConfig,
          branches: updatedBranches,
        };
      }),
    );
  };

  const handleRemoveNode = (nodeKey: string) => {
    setNodes((prev) => prev.filter((n) => n.nodeKey !== nodeKey));
    toast.success('Action step removed');
  };

  const handleMoveNode = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === nodes.length - 1) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    const updated = [...nodes];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setNodes(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Flow name is required');
      return;
    }
    if (triggerType === 'keyword_match' && keywords.length === 0) {
      toast.error('Please add at least one trigger keyword');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${baseUrl}/api/marketing/email/flows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          description,
          status,
          triggerType,
          triggerConfig: {
            keywords,
            matchMode: 'contains',
          },
          isGlobal,
          campaignIds: isGlobal ? [] : selectedCampaignIds,
          nodes: nodes.map((n, idx) => ({
            nodeKey: n.nodeKey,
            nodeType: n.nodeType,
            config: {
              ...n.config,
              branches: n.branches || n.config?.branches || undefined,
            },
            positionX: 100,
            positionY: (idx + 1) * 120,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save flow');
      }

      toast.success('Flow saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error saving flow');
    } finally {
      setSaving(false);
    }
  };

  const handleRunTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      // Save flow state first so simulation executes latest canvas nodes
      await fetch(`${baseUrl}/api/marketing/email/flows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          description,
          status,
          triggerType,
          triggerConfig: {
            keywords,
            matchMode: 'contains',
          },
          isGlobal,
          campaignIds: isGlobal ? [] : selectedCampaignIds,
          nodes: nodes.map((n, idx) => ({
            nodeKey: n.nodeKey,
            nodeType: n.nodeType,
            config: {
              ...n.config,
              branches: n.branches || n.config?.branches || undefined,
            },
            positionX: 100,
            positionY: (idx + 1) * 120,
          })),
        }),
      });

      const res = await fetch(`${baseUrl}/api/marketing/email/flows/${id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bodyText: testInput,
        }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.matchedFlowId && data.triggerMatched !== false) {
        toast.success(`Matched flow "${data.flowName || name}"!`);
      } else if (data.triggerMatched === false) {
        toast.info(data.triggerReason || 'Trigger keywords did not match.');
      } else {
        toast.info('No flow matched this input text.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Test simulation error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <p className="text-xs text-text-tertiary">Loading flow canvas...</p>
      </div>
    );
  }

  const allNodeKeys = nodes.map((n) => n.nodeKey);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* ── Top Header ── */}
      <EmailFlowHeaderBar
        id={id}
        name={name}
        setName={setName}
        nodeCount={nodes.length}
        status={status}
        setStatus={setStatus}
        onOpenTestModal={() => setTestModalOpen(true)}
        onSave={handleSave}
        saving={saving}
      />

      {/* ── Trigger & Scope Settings Card ── */}
      <EmailFlowTriggerConfigCard
        isGlobal={isGlobal}
        setIsGlobal={setIsGlobal}
        campaigns={campaigns}
        selectedCampaignIds={selectedCampaignIds}
        setSelectedCampaignIds={setSelectedCampaignIds}
        triggerType={triggerType}
        setTriggerType={setTriggerType}
        keywords={keywords}
        newKeyword={newKeyword}
        setNewKeyword={setNewKeyword}
        onAddKeyword={handleAddKeyword}
        onRemoveKeyword={handleRemoveKeyword}
      />

      {/* ── Action Nodes Canvas ── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Execution Action Steps ({nodes.length})</span>
          </h4>
        </div>

        {nodes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-bg-surface border border-dashed border-border-default rounded-2xl">
            <p className="text-xs text-text-secondary font-medium">
              No actions in this flow yet. Use the button below to add your first step!
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {nodes.map((node, index) => (
              <FlowNodeCard
                key={node.nodeKey}
                node={node}
                index={index}
                totalNodes={nodes.length}
                allNodes={nodes}
                allNodeKeys={allNodeKeys}
                existingTags={existingTags}
                updateNodeConfig={handleUpdateNodeConfig}
                removeNode={handleRemoveNode}
                moveNode={handleMoveNode}
              />
            ))}
          </div>
        )}

        {/* ── Add Node Dropdown ── */}
        <div className="flex justify-center pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-dashed border-border-default text-xs font-semibold px-4 py-2 hover:border-brand-600 hover:text-brand-600 gap-1.5 shadow-2xs"
              >
                <Plus className="h-4 w-4 text-brand-600" />
                <span>Add Flow Node</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-72 max-h-96 overflow-y-auto p-1.5">
              {(Object.keys(EMAIL_NODE_TYPES_META) as EmailFlowNodeType[])
                .filter((type) => type !== 'start')
                .map((type) => {
                  const m = EMAIL_NODE_TYPES_META[type];
                  const Icon = m.icon;
                  return (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => handleAddNode(type)}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-bg-subtle"
                    >
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
                          m.color.split(' ')[1],
                          m.color.split(' ')[0],
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">{m.label}</p>
                        <p className="text-[10px] text-text-muted">{m.desc}</p>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Test Simulator Modal ── */}
      <EmailFlowSimulationModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        testInput={testInput}
        setTestInput={setTestInput}
        onRunTest={handleRunTest}
        testing={testing}
        testResult={testResult}
      />
    </div>
  );
}
