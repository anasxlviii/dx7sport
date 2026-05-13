export const runtime = 'edge';
import ArticleEditClient from './ArticleEditClient';


export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleEditClient id={id} />;
}
