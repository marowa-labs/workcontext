"use client";

import {
  Calendar,
  Clock,
  ArrowRight,
  User,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import Layout from "../../components/Layout";
import { useState } from "react";
import { blogPosts, BlogPost } from "../../blogs/posts";

const categories = [
  "All",
  "Guides",
  "AI & Productivity",
  "Collaboration",
  "Features",
  "Security",
  "Productivity",
];

function BlogHero() {
  const router = useRouter();

  return (
    <section className="section-padding bg-[#121212] relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=600&fit=crop')",
        }}
      />
      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            WorkContext Blog
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            Tips, guides, and product updates to help you get the most out of
            your context-aware productivity workspace.
          </p>
        </div>
      </div>
    </section>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="aspect-video overflow-hidden relative">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-600 text-xs font-medium rounded-full">
            {post.category}
          </span>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {post.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {post.readTime}
          </span>
        </div>
        <h3 className="text-xl font-bold text-gray-600 mb-2 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 flex items-center gap-1.5">
            <User className="h-3 w-3" />
            {post.author}
          </span>
          <Link
            href={`/blogs/${post.slug}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
          >
            Read More
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function BlogContent() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts =
    activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((p) => p.category === activeCategory);

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-lg">No posts found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function BlogNewsletter() {
  const router = useRouter();

  return (
    <section className="section-padding relative overflow-hidden bg-[#121212]">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20 opacity-95"></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Get the latest product updates, tips, and guides delivered to your
            inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 px-4 py-3 rounded-lg text-gray-600 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BlogsPage() {
  return (
    <Layout>
      <BlogHero />
      <BlogContent />
      <BlogNewsletter />
    </Layout>
  );
}
