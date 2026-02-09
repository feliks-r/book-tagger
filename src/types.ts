export type Tag = {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  category?: TagCategory; // for joined queries
};

export type Profile = {
  id: string
  username: string
  role: string
  avatar_url: string | null
}

export type Book = {
  id: string;
  title: string;
  author: string;
  description?: string | null;
  publication_year?: number | null;
  cover_id?: number | null;
  series_id?: string | null;
  series_index?: number | null;
};

export type Series = {
  id: string;
  name: string;
  created_at: string;
};

export type TagCategory = {
  id: string;
  name: string;
  display_order: number;
};

export type BookTagWithVotes = {
  id: string;
  name: string;
  description: string | null;
  //category: TagCategory;
  category_id: string;
  category_name: string;
  category_display_order: number;
  score: number;
  user_value: -1 | 0 | 1;
};

export type BookTag = {
  userValue: -1 | 0 | 1;
  score: number;
  tag: {
    id: string;
    name: string;
    description: string | null;
    category: {
      id: string;
      name: string;
      display_order: number;
    };
  };
};

export type GroupedCategory = {
    categoryId: string;
    categoryName: string;
    displayOrder: number;
    tags: BookTagWithVotes[];
};

export type Bookshelf = {
  id: string;
  name: string;
  user_id: string;
  display_order: number;
  created_at: string;
};

export type BookshelfWithStatus = Bookshelf & {
  hasBook: boolean;
};

export type BookLink = {
  id: string;
  book_id: string;
  label: string;
  url: string;
  display_order: number;
  created_at: string;
};

export type UserTagPreference = {
  id: string;
  user_id: string;
  tag_id: string;
  preference: "saved" | "followed" | "hidden";
  created_at: string;
};

export type TagWithPreferences = Tag & {
  preferences: ("saved" | "followed" | "hidden")[];
};

export type TagProposal = {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
};
