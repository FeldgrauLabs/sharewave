import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";

interface SideCardProps {
  title: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const SideCard = ({ title, children, headerAction, footer }: SideCardProps) => {
  return (
    <Card className="min-h-[564px] flex flex-col w-full z-50 max-h-screen overflow-auto">
      <CardHeader className="flex items-center justify-between">
        <div className="flex flex-row items-center">
          <h2 className="text-lg font-medium">{title}</h2>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto py-2">
        <div>
          {children}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        {footer}
      </CardFooter>
    </Card>
  );
};