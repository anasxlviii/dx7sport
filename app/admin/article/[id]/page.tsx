import ArticleEditClient from './ArticleEditClient';

export const runtime = 'edge';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleEditClient id={id} />;
}
