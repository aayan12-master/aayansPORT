import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getSkills, updateSkillCategory } from '@/lib/cms';

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

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, category_title, description, skills, tools, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Skill Category ID required' }, { status: 400 });
    }

    await updateSkillCategory(id, {
      category_title,
      description,
      skills: Array.isArray(skills) ? skills : [],
      tools: Array.isArray(tools) ? tools : [],
      status,
    });

    const updated = await getSkills({ publishedOnly: false });
    return NextResponse.json({ success: true, message: 'Skill category updated', skills: updated });
  } catch (error) {
    console.error('Error updating skills:', error);
    return NextResponse.json({ success: false, error: 'Failed to update skills' }, { status: 500 });
  }
}
