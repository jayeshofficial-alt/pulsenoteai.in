import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import User from "@/models/User"

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const query: any = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }
  if (filter === 'premium') query.plan = 'premium';
  if (filter === 'free') query.plan = 'free';
  if (filter === 'banned') query.isBanned = true;

  const users = (User as any).find ? await (User as any).find(query).sort({ createdAt: -1 }).skip(skip).limit(limit) : [];
  const total = (User as any).countDocuments ? await (User as any).countDocuments(query) : 0;

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) || 1 });
}
