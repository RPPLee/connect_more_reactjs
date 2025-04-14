export interface Tag {
  id: number;
  tag_name: string;
}

export interface Status {
  id: number;
  status_name: string;
}

export interface Role {
  id: number;
  role_name: string;
}

export interface Flag {
  id: number;
  flag: string;
}

export interface Category {
  id: number;
  category_name: string;
}

export interface Subcategory {
  id: number;
  category_id: number;
  subcategory_name: string;
}

export interface Metadata {
  tags: Tag[];
  statuses: Status[];
  roles: Role[];
  flags: Flag[];
  categories: Category[];
  subcategories: Subcategory[];
} 