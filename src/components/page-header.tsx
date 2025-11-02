export const PageHeader = (props: { title: string, description: string }) => {
  return (
    <div className="mb-8">
    <h1 className="text-4xl font-bold mb-2">{props.title}</h1>
    <p className="text-muted-foreground">{props.description}</p>
  </div>
  );
};