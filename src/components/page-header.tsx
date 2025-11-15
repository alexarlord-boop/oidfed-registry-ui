export const PageHeader = (props: { title: string, description: string }) => {
  return (
    <div>
    <h1 className="text-lg font-bold">{props.title}</h1>
    <p className="text-muted-foreground">{props.description}</p>
  </div>
  );
};