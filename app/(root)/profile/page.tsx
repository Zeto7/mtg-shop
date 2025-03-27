import { prisma } from "@/prisma/prisma-client";
import { ProfileForm } from "@/shared/components/shared/profile-form";
import { getUserSession } from "@/shared/lib/get-user-session";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = getUserSession();

    if (!session) {
        return redirect('/not-auth');
    }

    // TODO : исправить id

    const user = await prisma.user.findFirst({ where: { id: session } });

    if (!user) {
        return redirect('/not-auth');
    }

    return <ProfileForm data={user} />
}