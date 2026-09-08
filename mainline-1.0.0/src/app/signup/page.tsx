import Image from "next/image";
import Link from "next/link";

import { FcGoogle } from "react-icons/fc";

import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const Signup = () => {
  return (
    <Background>
      <section className="py-28 lg:pt-44 lg:pb-32">
        <div className="container">
          <div className="flex flex-col gap-4">
            <Card className="mx-auto w-full max-w-sm">
              <CardHeader className="flex flex-col items-center space-y-0">
                <Link href="/" className="mb-5 flex flex-col items-center gap-2">
                  <Image
                    src="/mtsdecor.png"
                    alt="MTS DECOR"
                    width={48}
                    height={48}
                    className="rounded-lg object-contain"
                  />
                  <span className="font-display font-bold text-xl tracking-tight text-foreground">
                    MTS DECOR
                  </span>
                </Link>
                <p className="mb-1 text-2xl font-bold text-foreground">Start your free trial</p>
                <p className="text-muted-foreground text-sm">
                  Sign up in less than 2 minutes.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Input type="text" placeholder="Enter your name" required />
                  <Input type="email" placeholder="Enter your email" required />
                  <div>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      required
                    />
                    <p className="text-muted-foreground mt-1 text-sm">
                      Must be at least 8 characters.
                    </p>
                  </div>
                  <Button type="submit" className="mt-2 w-full">
                    Create an account
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FcGoogle className="mr-2 size-5" />
                    Sign up with Google
                  </Button>
                </div>
                <div className="text-muted-foreground mx-auto mt-8 flex justify-center gap-1 text-sm">
                  <p>Already have an account?</p>
                  <Link href="/login" className="text-primary font-medium">
                    Log in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Background>
  );
};

export default Signup;
