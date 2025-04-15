import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import InputHistory from '@/models/InputHistory';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const history = await InputHistory.find({ userId: session.user.id });
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching input history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch input history' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, calories, duration, type } = await request.json();
    
    await connectDB();
    
    // 使用 upsert 来更新或创建记录
    const history = await InputHistory.findOneAndUpdate(
      { 
        userId: session.user.id,
        name,
        type
      },
      {
        userId: session.user.id,
        name,
        calories,
        duration,
        type
      },
      { 
        upsert: true,
        new: true
      }
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error saving input history:', error);
    return NextResponse.json(
      { error: 'Failed to save input history' },
      { status: 500 }
    );
  }
} 