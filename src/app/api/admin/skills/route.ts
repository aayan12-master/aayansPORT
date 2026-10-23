import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getSkills, createSkillCategory, updateSkillCategory, deleteSkillCategory } from '@/lib/cms';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const skills = await getSkills({ publishedOnly: false });
    return NextResponse.json({ success: true, skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { category_num, category_title, description, skills, tools, display_order, status } = body;

    if (!category_num || typeof category_num !== 'string' || !category_num.trim()) {
      return NextResponse.json({ success: false, error: 'Category identifier/number is required' }, { status: 400 });
    }
    if (!category_title || typeof category_title !== 'string' || !category_title.trim()) {
      return NextResponse.json({ success: false, error: 'Category title is required' }, { status: 400 });
    }

    const created = await createSkillCategory({
      category_num: category_num.trim(),
      category_title: category_title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      skills: Array.isArray(skills) ? skills.map((s: any) => String(s).trim()).filter(Boolean) : [],
      tools: Array.isArray(tools) ? tools.map((t: any) => String(t).trim()).filter(Boolean) : [],
      display_order: typeof display_order === 'number' ? display_order : 0,
      status: status === 'draft' ? 'draft' : 'published',
    });

    const updated = await getSkills({ publishedOnly: false });
    return NextResponse.json({
      success: true,
      message: `Domain ${created.category_num} created successfully`,
      category: created,
      skills: updated,
    });
  } catch (error: any) {
    console.error('Error creating skill category:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create skill category' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Check for batch reorder request
    if (Array.isArray(body.reorder)) {
      for (const item of body.reorder) {
        if (item && item.id && typeof item.display_order === 'number') {
          await updateSkillCategory(item.id, { display_order: item.display_order });
        }
      }
      const updated = await getSkills({ publishedOnly: false });
      return NextResponse.json({ success: true, message: 'Domain order updated', skills: updated });
    }

    const { id, category_num, category_title, description, skills, tools, display_order, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Skill Category ID required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if (category_num !== undefined) {
      if (typeof category_num !== 'string' || !category_num.trim()) {
        return NextResponse.json({ success: false, error: 'Category identifier cannot be empty' }, { status: 400 });
      }
      updates.category_num = category_num.trim();
    }

    if (category_title !== undefined) {
      if (typeof category_title !== 'string' || !category_title.trim()) {
        return NextResponse.json({ success: false, error: 'Category title cannot be empty' }, { status: 400 });
      }
      updates.category_title = category_title.trim();
    }

    if (description !== undefined) {
      updates.description = typeof description === 'string' ? description.trim() : '';
    }

    if (skills !== undefined) {
      updates.skills = Array.isArray(skills) ? skills.map((s: any) => String(s).trim()).filter(Boolean) : [];
    }

    if (tools !== undefined) {
      updates.tools = Array.isArray(tools) ? tools.map((t: any) => String(t).trim()).filter(Boolean) : [];
    }

    if (display_order !== undefined) {
      if (typeof display_order !== 'number' || isNaN(display_order)) {
        return NextResponse.json({ success: false, error: 'Display order must be a valid number' }, { status: 400 });
      }
      updates.display_order = display_order;
    }

    if (status !== undefined) {
      if (status !== 'published' && status !== 'draft') {
        return NextResponse.json({ success: false, error: 'Status must be published or draft' }, { status: 400 });
      }
      updates.status = status;
    }

    await updateSkillCategory(id, updates);

    const updated = await getSkills({ publishedOnly: false });
    return NextResponse.json({ success: true, message: 'Skill category updated', skills: updated });
  } catch (error: any) {
    console.error('Error updating skills:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update skills' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ success: false, error: 'Skill Category ID required' }, { status: 400 });
    }

    await deleteSkillCategory(id.trim());

    const updated = await getSkills({ publishedOnly: false });
    return NextResponse.json({ success: true, message: 'Skill category deleted', skills: updated });
  } catch (error: any) {
    console.error('Error deleting skill category:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete skill category' }, { status: 500 });
  }
}
