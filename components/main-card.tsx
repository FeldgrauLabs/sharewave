import { Card, CardContent, CardHeader } from './ui/card';

interface MainCardProps {
  title: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export const MainCard = ({ title, children, headerAction }: MainCardProps) => {
  return (
    <Card className='flex h-full w-full'>
      <CardHeader>
        <div className='flex flex-row items-center justify-between'>
          <div className='flex flex-row gap-2 items-center'>
            <h2 className="text-lg font-medium">{title}</h2>
          </div>
          {headerAction && (
            <div>{headerAction}</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 w-full overflow-hidden">
        {children}
      </CardContent>
    </Card>
  )
}