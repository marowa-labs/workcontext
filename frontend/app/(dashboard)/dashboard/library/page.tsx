"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Trash2 } from "lucide-react";
import { useUser } from "../../../lib/utils/useUser";
import { ResearchService } from "../../../lib/utils/researchService";

export default function LibraryPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useUser();

  useEffect(() => {
    if (token) {
      fetchLibrary();
    }
  }, [token]);

  const fetchLibrary = async () => {
    try {
      const data = await ResearchService.getUserLibrary();
      setPapers(data || []);
    } catch (error) {
      console.error("Failed to fetch library", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading library...
      </div>
    );

  return (
    <div className="w-full p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            My Library
          </h1>
          <p className="text-muted-foreground">
            Manage your saved research papers and notes.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Find More Papers
        </Link>
      </div>

      {papers.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Your library is empty
          </h3>
          <p className="text-muted-foreground mb-6">
            Start searching for papers to add them to your collection.
          </p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Go to Search
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {papers.map((item: any) => {
            // The item IS the paper data now (ResearchSource structure)
            return (
              <div
                key={item.id}
                className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      <Link
                        href={`/dashboard/research/${item.id}`}
                        className="text-foreground hover:text-blue-600 dark:hover:text-blue-400">
                        {item.title}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>{item.year}</span>
                      <span>{item.journal || item.venue}</span>
                    </div>
                    {item.notes && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm text-foreground mb-4">
                        <span className="font-semibold block text-yellow-800 dark:text-yellow-500 mb-1">
                          Notes:
                        </span>
                        {item.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={async () => {
                        try {
                          if (
                            !confirm(
                              "Are you sure you want to remove this paper from your library?",
                            )
                          )
                            return;
                          const success =
                            await ResearchService.removePaperFromLibrary(
                              item.id,
                            );

                          if (success) {
                            setPapers((prev) =>
                              prev.filter((p) => p.id !== item.id),
                            );
                          }
                        } catch (e) {
                          console.error("Failed to delete", e);
                          alert("Failed to delete paper");
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove from Library">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <Link
                      href={`/dashboard/research/${item.id}`}
                      className="p-2 text-muted-foreground hover:text-blue-600 transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
