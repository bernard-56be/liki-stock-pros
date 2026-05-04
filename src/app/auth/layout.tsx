import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-[#e2e2e2] to-[#c9d6ff] p-4">
      {/* Ce conteneur centralise tout le contenu d'authentification. 
          Le dégradé est optimisé pour ne pas consommer de ressources GPU 
          importantes sur les téléphones de 2 Go de RAM.
      */}
      <main className="w-full flex justify-center items-center">
        {children}
      </main>
    </div>
  );
}