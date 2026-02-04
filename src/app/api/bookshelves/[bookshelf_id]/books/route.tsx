import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _: Request,
  { params }: { params: Promise<{ bookshelf_id: string }> }
) {
  const supabase = await createClient()
  const { bookshelf_id } = await params

  const { data, error } = await supabase
    .from("bookshelf_books")
    .select(`
      books (
        id,
        title,
        author,
        description,
        publication_year,
        series_index,
        series (
          id,
          name
        )
      )
    `)
    .eq("bookshelf_id", bookshelf_id)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ⬇️ unwrap nested result into Book[]
  const books =
    data
      ?.map(row => row.books)
      .filter((b): b is NonNullable<typeof b> => b !== null) ?? []

  return NextResponse.json({ books })
}


