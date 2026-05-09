import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, published, archived
  category: varchar('category', { length: 50 }).notNull(), // news, comparison, poll, match_report, transfer
  sourcePostUrl: text('source_post_url'),
  sourcePostText: text('source_post_text'),
  featuredImage: text('featured_image'),
  metadata: text('metadata'), // JSON for additional data
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
});

export const sources = pgTable('sources', {
  id: serial('id').primaryKey(),
  articleId: serial('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  title: text('title').notNull(),
  snippet: text('snippet'),
  credibility: varchar('credibility', { length: 20 }).notNull().default('medium'), // high, medium, low
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  articleId: serial('article_id').references(() => articles.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // image, video
  url: text('url').notNull(),
  alt: text('alt'),
  metadata: text('metadata'), // JSON for additional data
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Setting = typeof settings.$inferSelect;

