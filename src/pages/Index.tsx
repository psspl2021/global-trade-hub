// Minimal Index Test: 2025-12-07T19:55:00Z - No component imports
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-10">
        <h1 className="text-3xl font-bold text-primary mb-4">
          ✓ Index Page Working!
        </h1>
        <p className="text-muted-foreground mb-4">
          Minimal version with no component imports.
        </p>
        <Link to="/login" className="text-primary underline">
          Test Link to Login
        </Link>
      </div>
    </div>
  );
};

export default Index;
