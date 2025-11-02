import { PageHeader } from "@/components/page-header";
export const Empty = (props: { title: string, description: string }) => {
  return (
    <PageHeader title={props.title} description={props.description} />
  );
};