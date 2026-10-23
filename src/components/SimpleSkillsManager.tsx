'use client';

import React, { useState, useMemo } from 'react';
import type { SkillCategory } from '@/lib/cms';

export type SkillItemType = 'Competency' | 'Tool' | 'Domain';

export interface ManagedSkillItem {
  id: string;
  name: string;
  type: SkillItemType;
  domainId: string | number;
  domainNum: string;
  domainTitle: string;
  status: 'published' | 'draft';
  indexInDomain?: number;
  domainObj: SkillCategory;
}

export interface SimpleSkillsManagerProps {
  skillsList: SkillCategory[];
  onSaveDomain: (cat: SkillCategory) => Promise<boolean>;
  onCreateDomain: (data: {
    category_num: string;
    category_title: string;
    description: string;
    status: 'published' | 'draft';
  }) => Promise<SkillCategory | boolean | null>;
  onDeleteDomain: (id: string | number) => Promise<boolean>;
  onRefreshSkills: () => Promise<SkillCategory[] | void>;
  onShowFeedback?: (type: 'success' | 'error', message: string) => void;
}

export default function SimpleSkillsManager({
  skillsList,
  onSaveDomain,
  onCreateDomain,
  onDeleteDomain,
  onRefreshSkills,
  onShowFeedback,
}: SimpleSkillsManagerProps) {
  // Search query & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Competency' | 'Tool' | 'Domain'>('All');

  // Add / Edit Skill Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ManagedSkillItem | null>(null);

  // Skill Form Fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<SkillItemType>('Competency');
  const [formDomainId, setFormDomainId] = useState<string | number>('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Manage Domains Modal State
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [domainModalView, setDomainModalView] = useState<'list' | 'form'>('list');
  const [editingDomain, setEditingDomain] = useState<SkillCategory | null>(null);
  const [domainFormNum, setDomainFormNum] = useState('');
  const [domainFormTitle, setDomainFormTitle] = useState('');
  const [domainFormDescription, setDomainFormDescription] = useState('');
  const [domainFormStatus, setDomainFormStatus] = useState<'published' | 'draft'>('published');
  const [domainFormError, setDomainFormError] = useState('');
  const [isDomainSaving, setIsDomainSaving] = useState(false);
  const [returnToSkillModal, setReturnToSkillModal] = useState(false);

  // Domain Deletion Confirmation
  const [domainToDelete, setDomainToDelete] = useState<SkillCategory | null>(null);
  const [isDomainDeleting, setIsDomainDeleting] = useState(false);
  const [domainDeleteError, setDomainDeleteError] = useState('');

  // Skill Item Deletion Confirmation
  const [itemToDelete, setItemToDelete] = useState<ManagedSkillItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Local alert banner
  const [alertNotice, setAlertNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertNotice({ type, message });
    if (onShowFeedback) onShowFeedback(type, message);
    setTimeout(() => setAlertNotice(null), 5000);
  };

  // Flatten domain competencies and tools into a single readable list
  const allItems = useMemo<ManagedSkillItem[]>(() => {
    const list: ManagedSkillItem[] = [];
    for (const domain of skillsList) {
      const domainStatus = domain.status === 'draft' ? 'draft' : 'published';

      // 1. Competencies in this domain
      (domain.skills || []).forEach((skillName, idx) => {
        list.push({
          id: `comp-${domain.id}-${idx}`,
          name: skillName,
          type: 'Competency',
          domainId: domain.id,
          domainNum: domain.category_num,
          domainTitle: domain.category_title,
          status: domainStatus,
          indexInDomain: idx,
          domainObj: domain,
        });
      });

      // 2. Tools in this domain
      (domain.tools || []).forEach((toolName, idx) => {
        list.push({
          id: `tool-${domain.id}-${idx}`,
          name: toolName,
          type: 'Tool',
          domainId: domain.id,
          domainNum: domain.category_num,
          domainTitle: domain.category_title,
          status: domainStatus,
          indexInDomain: idx,
          domainObj: domain,
        });
      });

      // 3. Domain record itself
      list.push({
        id: `domain-${domain.id}`,
        name: domain.category_title,
        type: 'Domain',
        domainId: domain.id,
        domainNum: domain.category_num,
        domainTitle: domain.category_title,
        status: domainStatus,
        domainObj: domain,
      });
    }
    return list;
  }, [skillsList]);

  // Counts
  const totalCompetencies = useMemo(() => allItems.filter((i) => i.type === 'Competency').length, [allItems]);
  const totalTools = useMemo(() => allItems.filter((i) => i.type === 'Tool').length, [allItems]);
  const totalDomains = useMemo(() => allItems.filter((i) => i.type === 'Domain').length, [allItems]);

  // Filtered list based on search and selected tab
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (filterType !== 'All' && item.type !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDomain = item.domainTitle.toLowerCase().includes(q);
        const matchNum = item.domainNum.toLowerCase().includes(q);
        if (!matchName && !matchDomain && !matchNum) return false;
      }
      return true;
    });
  }, [allItems, filterType, searchQuery]);

  // -------------------------------------------------------------
  // SKILL MODAL HANDLERS
  // -------------------------------------------------------------
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormType('Competency');
    setFormDomainId(skillsList[0]?.id || '');
    setFormStatus('published');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ManagedSkillItem) => {
    if (item.type === 'Domain') {
      // Direct user to edit the domain in the domain modal
      handleOpenEditDomain(item.domainObj);
      return;
    }
    setEditingItem(item);
    setFormName(item.name);
    setFormType(item.type);
    setFormDomainId(item.domainId);
    setFormStatus(item.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseSkillModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingItem(null);
    setFormError('');
  };

  // -------------------------------------------------------------
  // DOMAIN MODAL HANDLERS
  // -------------------------------------------------------------
  const handleOpenManageDomains = () => {
    setReturnToSkillModal(false);
    setDomainModalView('list');
    setEditingDomain(null);
    setDomainFormError('');
    setIsDomainModalOpen(true);
  };

  const handleOpenCreateDomain = () => {
    setEditingDomain(null);
    setDomainFormNum(String(skillsList.length + 1).padStart(2, '0'));
    setDomainFormTitle('');
    setDomainFormDescription('');
    setDomainFormStatus('published');
    setDomainFormError('');
    setDomainModalView('form');
  };

  const handleOpenCreateDomainFromSkill = () => {
    // Preserve skill modal state, switch to domain creation
    setReturnToSkillModal(true);
    setEditingDomain(null);
    setDomainFormNum(String(skillsList.length + 1).padStart(2, '0'));
    setDomainFormTitle('');
    setDomainFormDescription('');
    setDomainFormStatus('published');
    setDomainFormError('');
    setIsModalOpen(false);
    setDomainModalView('form');
    setIsDomainModalOpen(true);
  };

  const handleOpenEditDomain = (domain: SkillCategory) => {
    setReturnToSkillModal(false);
    setEditingDomain(domain);
    setDomainFormNum(domain.category_num);
    setDomainFormTitle(domain.category_title);
    setDomainFormDescription(domain.description || '');
    setDomainFormStatus(domain.status === 'draft' ? 'draft' : 'published');
    setDomainFormError('');
    setDomainModalView('form');
    setIsDomainModalOpen(true);
  };

  const handleCloseDomainModal = () => {
    if (isDomainSaving) return;
    setIsDomainModalOpen(false);
    setEditingDomain(null);
    setDomainFormError('');
    if (returnToSkillModal) {
      setReturnToSkillModal(false);
      setIsModalOpen(true);
    }
  };

  // Save Domain (Create or Update)
  const handleSaveDomainForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setDomainFormError('');

    const trimmedNum = domainFormNum.trim();
    const trimmedTitle = domainFormTitle.trim();

    if (!trimmedNum) {
      setDomainFormError('Domain Code / Number is required (e.g. 01, 02).');
      return;
    }
    if (!trimmedTitle) {
      setDomainFormError('Domain Title is required (e.g. Active Reconnaissance & OSINT).');
      return;
    }

    setIsDomainSaving(true);
    try {
      if (!editingDomain) {
        // Create new domain
        const res = await onCreateDomain({
          category_num: trimmedNum,
          category_title: trimmedTitle,
          description: domainFormDescription.trim(),
          status: domainFormStatus,
        });

        if (res) {
          showAlert('success', `Domain ${trimmedNum} "${trimmedTitle}" created successfully.`);
          const refreshed = await onRefreshSkills();

          // Locate the created domain in refreshed list
          const targetList = Array.isArray(refreshed) ? refreshed : skillsList;
          const created =
            typeof res === 'object' && res !== null && 'id' in res
              ? res
              : targetList.find(
                  (d) => d.category_num === trimmedNum || d.category_title.toLowerCase() === trimmedTitle.toLowerCase()
                );

          if (returnToSkillModal) {
            if (created?.id) {
              setFormDomainId(created.id);
            }
            setIsDomainModalOpen(false);
            setReturnToSkillModal(false);
            setIsModalOpen(true);
          } else {
            setDomainModalView('list');
          }
        } else {
          setDomainFormError('Failed to create domain in Supabase. Check inputs and try again.');
        }
      } else {
        // Update existing domain
        const updatedCat: SkillCategory = {
          ...editingDomain,
          category_num: trimmedNum,
          category_title: trimmedTitle,
          description: domainFormDescription.trim(),
          status: domainFormStatus,
        };

        const ok = await onSaveDomain(updatedCat);
        if (ok) {
          showAlert('success', `Domain ${trimmedNum} "${trimmedTitle}" updated successfully.`);
          await onRefreshSkills();
          setDomainModalView('list');
        } else {
          setDomainFormError('Failed to update domain in Supabase.');
        }
      }
    } catch (err: any) {
      setDomainFormError(err.message || 'Error saving domain to database.');
    } finally {
      setIsDomainSaving(false);
    }
  };

  // Confirm Delete Domain
  const handleConfirmDeleteDomain = async () => {
    if (!domainToDelete) return;
    setDomainDeleteError('');
    setIsDomainDeleting(true);

    try {
      const ok = await onDeleteDomain(domainToDelete.id);
      if (ok) {
        showAlert('success', `Domain ${domainToDelete.category_num} (${domainToDelete.category_title}) deleted.`);
        await onRefreshSkills();
        setDomainToDelete(null);
      } else {
        setDomainDeleteError('Failed to delete domain from database.');
      }
    } catch (err: any) {
      setDomainDeleteError(err.message || 'Error deleting domain.');
    } finally {
      setIsDomainDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // SAVE SKILL (COMPETENCY OR TOOL)
  // -------------------------------------------------------------
  const handleSaveSkillForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Please enter a skill or tool name.');
      return;
    }

    if (!formDomainId) {
      setFormError('Please select a parent domain.');
      return;
    }

    const targetDomain = skillsList.find((d) => String(d.id) === String(formDomainId));
    if (!targetDomain) {
      setFormError('Selected parent domain was not found. Please choose an existing domain.');
      return;
    }

    if (!editingItem) {
      // Check for duplicate in target domain
      const existingList = formType === 'Competency' ? targetDomain.skills || [] : targetDomain.tools || [];
      if (existingList.some((s) => s.toLowerCase() === trimmedName.toLowerCase())) {
        setFormError(`"${trimmedName}" is already registered under ${targetDomain.category_title}.`);
        return;
      }

      setIsSaving(true);
      try {
        const updatedCat: SkillCategory = {
          ...targetDomain,
          skills: formType === 'Competency' ? [...(targetDomain.skills || []), trimmedName] : targetDomain.skills || [],
          tools: formType === 'Tool' ? [...(targetDomain.tools || []), trimmedName] : targetDomain.tools || [],
        };
        const ok = await onSaveDomain(updatedCat);
        if (ok) {
          showAlert('success', `${formType} "${trimmedName}" saved and published.`);
          await onRefreshSkills();
          setIsModalOpen(false);
        } else {
          setFormError('Failed to save skill to Supabase. Please retry.');
        }
      } catch (err: any) {
        setFormError(err.message || 'Error saving skill to database.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Editing existing item
    const sourceDomain = skillsList.find((d) => String(d.id) === String(editingItem.domainId));
    if (!sourceDomain) {
      setFormError('Original parent domain was not found.');
      return;
    }

    setIsSaving(true);
    try {
      const isDomainChanged = String(sourceDomain.id) !== String(targetDomain.id);

      if (!isDomainChanged) {
        // Same domain: update in-place, handling potential type switch
        let updatedSkills = [...(sourceDomain.skills || [])];
        let updatedTools = [...(sourceDomain.tools || [])];

        // Remove old item from its previous type list
        if (editingItem.type === 'Competency') {
          updatedSkills = updatedSkills.filter((_, idx) => idx !== editingItem.indexInDomain);
        } else if (editingItem.type === 'Tool') {
          updatedTools = updatedTools.filter((_, idx) => idx !== editingItem.indexInDomain);
        }

        // Add to new type list
        if (formType === 'Competency') {
          updatedSkills.push(trimmedName);
        } else if (formType === 'Tool') {
          updatedTools.push(trimmedName);
        }

        const ok = await onSaveDomain({
          ...sourceDomain,
          skills: updatedSkills,
          tools: updatedTools,
        });

        if (ok) {
          showAlert('success', `Updated "${trimmedName}" successfully.`);
          await onRefreshSkills();
          setIsModalOpen(false);
        } else {
          setFormError('Failed to update skill in Supabase.');
        }
      } else {
        // Domain changed: Remove from source domain, add to target domain
        let sourceSkills = [...(sourceDomain.skills || [])];
        let sourceTools = [...(sourceDomain.tools || [])];

        if (editingItem.type === 'Competency') {
          sourceSkills = sourceSkills.filter((_, idx) => idx !== editingItem.indexInDomain);
        } else if (editingItem.type === 'Tool') {
          sourceTools = sourceTools.filter((_, idx) => idx !== editingItem.indexInDomain);
        }

        const okSource = await onSaveDomain({
          ...sourceDomain,
          skills: sourceSkills,
          tools: sourceTools,
        });

        if (!okSource) {
          setFormError('Failed to update source domain.');
          setIsSaving(false);
          return;
        }

        let targetSkills = [...(targetDomain.skills || [])];
        let targetTools = [...(targetDomain.tools || [])];

        if (formType === 'Competency') {
          targetSkills.push(trimmedName);
        } else if (formType === 'Tool') {
          targetTools.push(trimmedName);
        }

        const okTarget = await onSaveDomain({
          ...targetDomain,
          skills: targetSkills,
          tools: targetTools,
        });

        if (okTarget) {
          showAlert('success', `Moved "${trimmedName}" to ${targetDomain.category_title}.`);
          await onRefreshSkills();
          setIsModalOpen(false);
        } else {
          setFormError('Removed from original domain, but failed to add to new domain.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Error updating skill in database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Delete Single Skill Item
  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setDeleteError('');
    setIsDeleting(true);

    try {
      const parentDomain = skillsList.find((d) => String(d.id) === String(itemToDelete.domainId));
      if (!parentDomain) {
        setDeleteError('Parent domain not found.');
        setIsDeleting(false);
        return;
      }

      const updatedCat: SkillCategory = {
        ...parentDomain,
        skills:
          itemToDelete.type === 'Competency'
            ? (parentDomain.skills || []).filter((_, idx) => idx !== itemToDelete.indexInDomain)
            : parentDomain.skills || [],
        tools:
          itemToDelete.type === 'Tool'
            ? (parentDomain.tools || []).filter((_, idx) => idx !== itemToDelete.indexInDomain)
            : parentDomain.tools || [],
      };

      const ok = await onSaveDomain(updatedCat);
      if (ok) {
        showAlert('success', `Deleted "${itemToDelete.name}".`);
        await onRefreshSkills();
        setItemToDelete(null);
        if (isModalOpen) setIsModalOpen(false);
      } else {
        setDeleteError('Failed to remove item from domain.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting item.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* 1. Header & Actions Bar (Clean header with no subtitle) */}
      <div className="p-5 sm:p-6 bg-[#F2EFE7] border-2 border-[#171514] shadow-[4px_4px_0px_#171514] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] font-bold text-[#DF491E] uppercase tracking-wider">
            AAYAN.SEC / CMS
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#171514] tracking-tight uppercase mt-0.5">
            Manage Skills
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="manage-domains-button"
            onClick={handleOpenManageDomains}
            className="w-full sm:w-auto px-4 py-3 bg-[#ECE8DF] text-[#171514] font-bold text-xs uppercase border-2 border-[#171514] shadow-[3px_3px_0px_#171514] hover:bg-[#171514] hover:text-[#ECE8DF] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            title="Manage operational domains, numbers, and categories"
          >
            <span>⚙</span>
            <span>MANAGE DOMAINS</span>
          </button>
          <button
            type="button"
            id="add-new-skill-button"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-5 py-3 bg-[#DF491E] text-[#171514] font-bold text-xs uppercase border-2 border-[#171514] shadow-[3px_3px_0px_#171514] hover:bg-[#171514] hover:text-[#ECE8DF] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="text-lg font-extrabold leading-none">+</span>
            <span>ADD NEW SKILL</span>
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alertNotice && (
        <div
          className={`p-3.5 border-2 font-mono text-xs flex items-center justify-between shadow-[2px_2px_0px_#171514] ${
            alertNotice.type === 'success'
              ? 'bg-[#10B981]/15 border-[#10B981] text-[#065F46]'
              : 'bg-[#DF491E]/15 border-[#DF491E] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{alertNotice.type === 'success' ? '✓' : '⚠️'}</span>
            <span className="font-bold">{alertNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertNotice(null)}
            className="text-xs font-bold px-2 py-0.5 hover:opacity-70 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Large Search Field & Filter Tabs */}
      <div className="p-4 sm:p-5 bg-[#ECE8DF] border-2 border-[#171514] shadow-[4px_4px_0px_#171514] space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A5650] font-mono text-sm">
            🔍
          </div>
          <input
            id="skills-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills..."
            className="w-full pl-10 pr-9 py-3 bg-[#F2EFE7] border-2 border-[#171514] font-mono text-sm text-[#171514] placeholder-[#5A5650] focus:outline-none focus:border-[#DF491E] shadow-[2px_2px_0px_#171514]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5A5650] hover:text-[#171514] font-bold text-xs cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Clean Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Competency', 'Tool', 'Domain'] as const).map((type) => {
              const count =
                type === 'All'
                  ? allItems.length
                  : type === 'Competency'
                  ? totalCompetencies
                  : type === 'Tool'
                  ? totalTools
                  : totalDomains;

              const isSelected = filterType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 font-bold border transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-[#171514] text-[#ECE8DF] border-[#171514]'
                      : 'bg-[#F2EFE7] text-[#171514] border-[#171514]/30 hover:border-[#171514]'
                  }`}
                >
                  {type.toUpperCase()} ({count})
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-[#5A5650]">
            Showing {filteredItems.length} of {allItems.length} items
          </div>
        </div>
      </div>

      {/* 3. Saved Items (Clean List) */}
      <div className="border-2 border-[#171514] bg-[#ECE8DF] shadow-[4px_4px_0px_#171514] overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3 font-mono">
            <div className="text-3xl text-[#5A5650]">∅</div>
            <div className="text-base font-bold text-[#171514]">
              {searchQuery ? `No skills match "${searchQuery}"` : 'No saved skills found'}
            </div>
            <p className="text-xs text-[#5A5650] max-w-sm mx-auto">
              Click &quot;+ ADD NEW SKILL&quot; above to add your technical competencies and tools.
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-1.5 bg-[#171514] text-[#ECE8DF] text-xs font-bold border border-[#171514] cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#171514]/20">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 bg-[#ECE8DF] hover:bg-[#F2EFE7] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Type + Name + Parent Domain */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* Type Badge */}
                  <div className="shrink-0 pt-0.5 sm:pt-0">
                    {item.type === 'Competency' && (
                      <span className="px-2.5 py-1 bg-[#171514] text-[#ECE8DF] font-mono text-[10px] font-bold tracking-wider uppercase border border-[#171514]">
                        Competency
                      </span>
                    )}
                    {item.type === 'Tool' && (
                      <span className="px-2.5 py-1 bg-[#ECE8DF] text-[#DF491E] font-mono text-[10px] font-bold tracking-wider uppercase border border-[#DF491E]">
                        Tool
                      </span>
                    )}
                    {item.type === 'Domain' && (
                      <span className="px-2.5 py-1 bg-[#DF491E] text-[#171514] font-mono text-[10px] font-extrabold tracking-wider uppercase border border-[#171514]">
                        Domain {item.domainNum}
                      </span>
                    )}
                  </div>

                  {/* Name and Parent Context */}
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-[#171514] truncate font-sans">
                      {item.name}
                    </div>
                    <div className="font-mono text-xs text-[#5A5650] truncate mt-0.5">
                      {item.type === 'Domain' ? (
                        <span>
                          Category &bull; {item.domainObj.skills?.length || 0} competencies &bull;{' '}
                          {item.domainObj.tools?.length || 0} tools
                        </span>
                      ) : (
                        <span>
                          Domain {item.domainNum} &bull; {item.domainTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Publication Status + EDIT & DELETE Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.status === 'published' ? 'bg-[#10B981]' : 'bg-[#DF491E]'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-bold uppercase ${
                        item.status === 'published' ? 'text-[#065F46]' : 'text-[#DF491E]'
                      }`}
                    >
                      {item.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 pl-2 border-l border-[#171514]/20">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-1.5 text-xs font-bold bg-[#F2EFE7] text-[#171514] border border-[#171514] hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer"
                      title={item.type === 'Domain' ? 'Edit domain settings' : 'Edit skill or tool'}
                    >
                      EDIT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.type === 'Domain') {
                          setDomainToDelete(item.domainObj);
                        } else {
                          setItemToDelete(item);
                        }
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold bg-[#F2EFE7] text-[#DF491E] border border-[#171514]/40 hover:bg-[#DF491E] hover:text-[#171514] hover:border-[#171514] transition-colors cursor-pointer"
                      title="Delete item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. ADD / EDIT SKILL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171514]/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#ECE8DF] border-2 border-[#171514] shadow-[8px_8px_0px_#171514] p-5 sm:p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-[#171514] pb-3">
              <div>
                <div className="font-mono text-[10px] font-bold text-[#DF491E] uppercase">
                  {editingItem ? '// EDIT ENTRY' : '// NEW REGISTRATION'}
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#171514] uppercase">
                  {editingItem ? `Edit ${editingItem.type}` : 'Add New Skill'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseSkillModal}
                disabled={isSaving}
                className="text-lg font-mono font-bold text-[#171514] hover:text-[#DF491E] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error in modal */}
            {formError && (
              <div className="p-3 bg-[#DF491E]/15 border border-[#DF491E] text-xs font-mono text-[#991B1B]">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSaveSkillForm} className="space-y-4 font-mono text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5A5650] mb-1">
                  Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('Competency')}
                    className={`py-2 text-center border font-bold cursor-pointer transition-colors ${
                      formType === 'Competency'
                        ? 'bg-[#171514] text-[#ECE8DF] border-[#171514]'
                        : 'bg-[#F2EFE7] text-[#171514] border-[#171514]/30 hover:border-[#171514]'
                    }`}
                  >
                    Competency
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('Tool')}
                    className={`py-2 text-center border font-bold cursor-pointer transition-colors ${
                      formType === 'Tool'
                        ? 'bg-[#DF491E] text-[#171514] border-[#171514]'
                        : 'bg-[#F2EFE7] text-[#171514] border-[#171514]/30 hover:border-[#171514]'
                    }`}
                  >
                    Tool
                  </button>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5A5650] mb-1">
                  Name <span className="text-[#DF491E]">*</span>:
                </label>
                <input
                  id="add-item-name-input"
                  type="text"
                  autoFocus
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={
                    formType === 'Competency'
                      ? 'e.g. OAuth 2.0 / OIDC Flaws, Kernel Exploitation'
                      : 'e.g. Burp Suite Pro, Ghidra, Nuclei'
                  }
                  required
                  className="w-full px-3.5 py-2.5 bg-[#F2EFE7] border-2 border-[#171514] text-sm font-sans text-[#171514] placeholder-[#5A5650] focus:outline-none focus:border-[#DF491E]"
                />
              </div>

              {/* Parent Domain Section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-[#5A5650]">
                    Parent Domain <span className="text-[#DF491E]">*</span>:
                  </label>
                  {skillsList.length > 0 && (
                    <button
                      type="button"
                      id="create-domain-from-skill-btn"
                      onClick={handleOpenCreateDomainFromSkill}
                      className="text-[11px] font-bold text-[#DF491E] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>+</span> Create Domain
                    </button>
                  )}
                </div>

                {skillsList.length === 0 ? (
                  <div className="p-3 bg-[#DF491E]/10 border-2 border-[#DF491E] space-y-2">
                    <p className="text-xs font-bold text-[#171514]">
                      No operational domains exist in the database yet.
                    </p>
                    <p className="text-[11px] text-[#5A5650]">
                      Every competency or tool must belong to a parent domain.
                    </p>
                    <button
                      type="button"
                      id="create-first-domain-btn"
                      onClick={handleOpenCreateDomainFromSkill}
                      className="px-3.5 py-1.5 bg-[#DF491E] text-[#171514] text-xs font-bold border border-[#171514] hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer"
                    >
                      + Create Your First Domain
                    </button>
                  </div>
                ) : (
                  <select
                    id="skill-parent-domain-select"
                    value={formDomainId}
                    onChange={(e) => setFormDomainId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2EFE7] border-2 border-[#171514] text-xs font-mono text-[#171514] focus:outline-none focus:border-[#DF491E] cursor-pointer"
                  >
                    {skillsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.category_num} • {d.category_title}
                      </option>
                    ))}
                  </select>
                )}

                {editingItem && (
                  <p className="text-[10px] text-[#5A5650] mt-1">
                    Selecting a different domain will move this skill to that domain.
                  </p>
                )}
              </div>

              {/* Publication Status Field */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5A5650] mb-1">
                  Publication Status:
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'published' | 'draft')}
                  className="w-full px-3 py-2 bg-[#F2EFE7] border-2 border-[#171514] text-xs font-mono text-[#171514] focus:outline-none focus:border-[#DF491E] cursor-pointer"
                >
                  <option value="published">Published (Visible on Portfolio)</option>
                  <option value="draft">Draft (Hidden from Public)</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-between pt-3 border-t-2 border-[#171514]/20">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      setItemToDelete(editingItem);
                    }}
                    disabled={isSaving}
                    className="px-3 py-2 text-xs font-bold text-[#DF491E] hover:underline cursor-pointer"
                  >
                    Delete item...
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseSkillModal}
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#ECE8DF] border border-[#171514] text-[#171514] font-bold hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || skillsList.length === 0}
                    className="px-5 py-2 bg-[#DF491E] border-2 border-[#171514] text-[#171514] font-bold shadow-[2px_2px_0px_#171514] hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MANAGE DOMAINS MODAL */}
      {isDomainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171514]/75 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#ECE8DF] border-2 border-[#171514] shadow-[8px_8px_0px_#171514] p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-[#171514] pb-3">
              <div>
                <div className="font-mono text-[10px] font-bold text-[#DF491E] uppercase">
                  {domainModalView === 'list'
                    ? '// DOMAINS CONFIGURATION'
                    : editingDomain
                    ? '// EDIT DOMAIN'
                    : '// NEW DOMAIN'}
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#171514] uppercase">
                  {domainModalView === 'list'
                    ? 'Manage Domains'
                    : editingDomain
                    ? `Edit Domain ${editingDomain.category_num}`
                    : 'Create New Domain'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDomainModal}
                disabled={isDomainSaving}
                className="text-lg font-mono font-bold text-[#171514] hover:text-[#DF491E] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error in domain modal */}
            {domainFormError && (
              <div className="p-3 bg-[#DF491E]/15 border border-[#DF491E] text-xs font-mono text-[#991B1B]">
                ⚠️ {domainFormError}
              </div>
            )}

            {/* View A: Domains List */}
            {domainModalView === 'list' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between gap-3 bg-[#F2EFE7] p-3 border border-[#171514]/40">
                  <p className="text-[#5A5650] text-[11px]">
                    Operational parent domains group competencies and tools across your portfolio.
                  </p>
                  <button
                    type="button"
                    id="create-new-domain-btn"
                    onClick={handleOpenCreateDomain}
                    className="px-3.5 py-2 bg-[#DF491E] text-[#171514] font-bold text-xs border border-[#171514] hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer shrink-0"
                  >
                    + CREATE NEW DOMAIN
                  </button>
                </div>

                {skillsList.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-[#171514]/40 bg-[#F2EFE7] space-y-3">
                    <p className="font-bold text-[#171514]">No domains registered in database.</p>
                    <button
                      type="button"
                      onClick={handleOpenCreateDomain}
                      className="px-4 py-2 bg-[#DF491E] text-[#171514] font-bold text-xs border border-[#171514] cursor-pointer"
                    >
                      + Create Your First Domain
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#171514]/20 border border-[#171514] bg-[#F2EFE7]">
                    {skillsList.map((domain) => (
                      <div
                        key={domain.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#ECE8DF] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-[#DF491E] text-[#171514] font-extrabold text-[10px] border border-[#171514]">
                              {domain.category_num}
                            </span>
                            <span className="font-sans font-bold text-sm text-[#171514] truncate">
                              {domain.category_title}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                domain.status === 'draft'
                                  ? 'bg-[#DF491E]/20 text-[#DF491E]'
                                  : 'bg-[#10B981]/20 text-[#065F46]'
                              }`}
                            >
                              {domain.status === 'draft' ? 'Draft' : 'Published'}
                            </span>
                          </div>
                          {domain.description && (
                            <p className="font-sans text-xs text-[#5A5650] line-clamp-1">
                              {domain.description}
                            </p>
                          )}
                          <div className="text-[10px] text-[#5A5650] mt-1">
                            {domain.skills?.length || 0} Competencies &bull; {domain.tools?.length || 0} Tools
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            id={`edit-domain-${domain.id}`}
                            onClick={() => handleOpenEditDomain(domain)}
                            className="px-3 py-1.5 text-xs font-bold bg-[#ECE8DF] text-[#171514] border border-[#171514] hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer"
                          >
                            EDIT
                          </button>
                          <button
                            type="button"
                            id={`delete-domain-${domain.id}`}
                            onClick={() => setDomainToDelete(domain)}
                            className="px-2.5 py-1.5 text-xs font-bold bg-[#ECE8DF] text-[#DF491E] border border-[#171514]/40 hover:bg-[#DF491E] hover:text-[#171514] transition-colors cursor-pointer"
                            title="Delete domain"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCloseDomainModal}
                    className="px-4 py-2 bg-[#ECE8DF] border border-[#171514] text-[#171514] font-bold hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            )}

            {/* View B: Create / Edit Domain Form */}
            {domainModalView === 'form' && (
              <form onSubmit={handleSaveDomainForm} className="space-y-4 font-mono text-xs">
                {/* Domain Number / Code */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#5A5650] mb-1">
                    Domain Code / Identifier <span className="text-[#DF491E]">*</span>:
                  </label>
                  <input
                    id="domain-num-input"
                    type="text"
                    required
                    value={domainFormNum}
                    onChange={(e) => setDomainFormNum(e.target.value)}
                    placeholder="e.g. 01, 02, 05"
                    className="w-full px-3.5 py-2.5 bg-[#F2EFE7] border-2 border-[#171514] text-xs font-mono text-[#171514] focus:outline-none focus:border-[#DF491E]"
                  />
                  <p className="text-[10px] text-[#5A5650] mt-1">
                    Displayed in constellation hub badges and technical dossier headings.
                  </p>
                </div>

                {/* Domain Title */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#5A5650] mb-1">
                    Domain Title <span className="text-[#DF491E]">*</span>:
                  </label>
                  <input
                    id="domain-title-input"
                    type="text"
                    required
                    value={domainFormTitle}
                    onChange={(e) => setDomainFormTitle(e.target.value)}
                    placeholder="e.g. Active Reconnaissance & OSINT"
                    className="w-full px-3.5 py-2.5 bg-[#F2EFE7] border-2 border-[#171514] text-sm font-sans font-bold text-[#171514] focus:outline-none focus:border-[#DF491E]"
                  />
                </div>

                {/* Domain Description */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#5A5650] mb-1">
                    Description / Scope:
                  </label>
                  <textarea
                    id="domain-desc-input"
                    rows={3}
                    value={domainFormDescription}
                    onChange={(e) => setDomainFormDescription(e.target.value)}
                    placeholder="Brief description of skills, methodologies, and technical focus areas under this domain."
                    className="w-full px-3.5 py-2 bg-[#F2EFE7] border-2 border-[#171514] text-xs font-sans text-[#171514] focus:outline-none focus:border-[#DF491E]"
                  />
                </div>

                {/* Publication Status */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#5A5650] mb-1">
                    Publication Status:
                  </label>
                  <select
                    id="domain-status-select"
                    value={domainFormStatus}
                    onChange={(e) => setDomainFormStatus(e.target.value as 'published' | 'draft')}
                    className="w-full px-3 py-2 bg-[#F2EFE7] border-2 border-[#171514] text-xs font-mono text-[#171514] focus:outline-none focus:border-[#DF491E] cursor-pointer"
                  >
                    <option value="published">Published (Visible on Portfolio & Constellation)</option>
                    <option value="draft">Draft (Hidden from Public)</option>
                  </select>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-[#171514]/20">
                  <button
                    type="button"
                    onClick={() => {
                      if (returnToSkillModal) {
                        setIsDomainModalOpen(false);
                        setReturnToSkillModal(false);
                        setIsModalOpen(true);
                      } else {
                        setDomainModalView('list');
                      }
                    }}
                    disabled={isDomainSaving}
                    className="px-4 py-2 bg-[#ECE8DF] border border-[#171514] text-[#171514] font-bold hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {returnToSkillModal ? 'BACK TO SKILL FORM' : 'BACK TO DOMAINS'}
                  </button>

                  <button
                    type="submit"
                    id="save-domain-submit-btn"
                    disabled={isDomainSaving}
                    className="px-5 py-2 bg-[#DF491E] border-2 border-[#171514] text-[#171514] font-bold shadow-[2px_2px_0px_#171514] hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isDomainSaving ? 'SAVING DOMAIN...' : 'SAVE DOMAIN'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. DELETE DOMAIN CONFIRMATION MODAL */}
      {domainToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171514]/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#ECE8DF] border-2 border-[#171514] shadow-[8px_8px_0px_#171514] p-5 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#171514] pb-3">
              <div>
                <div className="font-mono text-[10px] font-bold text-[#DF491E] uppercase">
                  // CONFIRM DOMAIN REMOVAL
                </div>
                <h3 className="font-display text-xl font-bold text-[#171514] uppercase">
                  Delete Domain {domainToDelete.category_num}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDomainToDelete(null)}
                disabled={isDomainDeleting}
                className="text-lg font-mono font-bold text-[#171514] hover:text-[#DF491E] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {domainDeleteError && (
              <div className="p-2.5 bg-[#DF491E]/15 border border-[#DF491E] text-xs font-mono text-[#991B1B]">
                ⚠️ {domainDeleteError}
              </div>
            )}

            <div className="space-y-3 text-xs font-mono">
              <p className="text-[#171514]">
                Are you sure you want to delete{' '}
                <strong className="underline text-[#DF491E]">
                  Domain {domainToDelete.category_num} ({domainToDelete.category_title})
                </strong>
                ?
              </p>
              <div className="p-3 bg-[#DF491E]/15 border-2 border-[#DF491E] text-[#991B1B] text-[11px] leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>PERMANENT DATA REMOVAL WARNING</span>
                </div>
                <p>
                  This domain currently contains{' '}
                  <strong>{domainToDelete.skills?.length || 0} competencies</strong> and{' '}
                  <strong>{domainToDelete.tools?.length || 0} tools</strong>.
                </p>
                <p>
                  Deleting this domain will permanently remove it along with all of its associated skills and tools from the Supabase database.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#171514]/20 font-mono text-xs">
              <button
                type="button"
                onClick={() => setDomainToDelete(null)}
                disabled={isDomainDeleting}
                className="px-4 py-2 bg-[#ECE8DF] border border-[#171514] text-[#171514] font-bold hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                id="confirm-delete-domain-btn"
                onClick={handleConfirmDeleteDomain}
                disabled={isDomainDeleting}
                className="px-4 py-2 bg-[#DF491E] border border-[#171514] text-[#171514] font-bold hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDomainDeleting ? 'DELETING...' : 'CONFIRM DELETE DOMAIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DELETE SINGLE ITEM CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171514]/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#ECE8DF] border-2 border-[#171514] shadow-[8px_8px_0px_#171514] p-5 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#171514] pb-3">
              <div>
                <div className="font-mono text-[10px] font-bold text-[#DF491E] uppercase">
                  // CONFIRM ACTION
                </div>
                <h3 className="font-display text-xl font-bold text-[#171514] uppercase">
                  Delete {itemToDelete.type}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="text-lg font-mono font-bold text-[#171514] hover:text-[#DF491E] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-[#DF491E]/15 border border-[#DF491E] text-xs font-mono text-[#991B1B]">
                ⚠️ {deleteError}
              </div>
            )}

            <div className="space-y-2 text-xs font-mono">
              <p className="text-[#171514]">
                Are you sure you want to delete{' '}
                <strong className="underline text-[#DF491E]">{itemToDelete.name}</strong>?
              </p>
              <p className="text-[#5A5650] text-[11px]">
                This will remove the item from Domain {itemToDelete.domainNum} ({itemToDelete.domainTitle}) and update the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#171514]/20 font-mono text-xs">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#ECE8DF] border border-[#171514] text-[#171514] font-bold hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                id="confirm-delete-item-btn"
                onClick={handleConfirmDeleteItem}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#DF491E] border border-[#171514] text-[#171514] font-bold hover:bg-[#171514] hover:text-[#ECE8DF] transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
