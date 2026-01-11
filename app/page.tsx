"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6">
      <WelcomeCard />
    </main>
  );
}

function WelcomeCard() {
  const [count, setCount] = React.useState<number>(3);
  const router = useRouter();

  const clamped = Math.min(10, Math.max(1, count));
  const canSubmit = clamped >= 1 && clamped <= 10;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          Welcome. How many categories of questions are there?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCount(Number(e.target.value))
            }
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!canSubmit}
          onClick={() => router.push(`/builder?count=${clamped}`)}
        >
          Create Categories
        </Button>
      </CardFooter>
    </Card>
  );
}
