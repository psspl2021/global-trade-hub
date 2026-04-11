import { useNavigate } from 'react-router-dom';
import { DemoGuidedFlow } from '@/components/demo/DemoGuidedFlow';

export default function AdminDemoPage() {
  const navigate = useNavigate();

  return (
    <DemoGuidedFlow
      onReset={() => undefined}
      onExit={() => navigate('/')}
    />
  );
}
