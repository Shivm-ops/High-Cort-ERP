import { redirect } from "next/navigation";

export default function ConsumerRedirect() {
  redirect("/login?portal=citizen");
}

