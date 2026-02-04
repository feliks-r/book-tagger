import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ------------------------------ GET ------------------------------
export async function GET(
  _: Request,
  { params }: { params: { bookId: string } }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: shelves } = await supabase
    .from("bookshelves")
    .select("id, name, display_order")
    .eq("user_id", user.id)
    .order("display_order")

  const { data: memberships } = await supabase
    .from("bookshelf_books")
    .select("bookshelf_id")
    .eq("book_id", params.bookId)

  const membershipSet = new Set(
    memberships?.map(m => m.bookshelf_id)
  )

  const defaultShelf =
    shelves?.find(s => s.display_order === 0) ?? null

  return NextResponse.json({
    shelves: shelves?.map(s => ({
      ...s,
      hasBook: membershipSet.has(s.id),
    })),
    defaultShelfId: defaultShelf?.id ?? null,
  })
}

// ------------------------------ POST ------------------------------
export async function POST(
  req: Request,
  { params }: { params: { bookId: string } }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { shelfId, action } = await req.json()

  if (action === "add") {
    await supabase
      .from("bookshelf_books")
      .insert({
        book_id: params.bookId,
        bookshelf_id: shelfId,
      })
  }

  if (action === "remove") {
    await supabase
      .from("bookshelf_books")
      .delete()
      .eq("book_id", params.bookId)
      .eq("bookshelf_id", shelfId)
  }

  return NextResponse.json({ ok: true })
}
