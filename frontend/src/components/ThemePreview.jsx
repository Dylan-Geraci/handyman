import React from "react";

export default function ThemePreview() {
  return (
    <div className="bg-[#FBF7F2] border-t-4 border-[#C08957] mt-12 py-10">
      <div className="max-w-4xl mx-auto px-4">

        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">
          🎨 Clay + Cream Theme Preview
        </h2>

        <p className="text-sm text-[#1A1A1A] mb-6 opacity-70">
          A warm, cozy, earthy palette. This preview does <strong>not</strong>
          update the whole site automatically — but it serves as your official brand guide.
        </p>

        {/* COLOR GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* Primary */}
          <div className="rounded-xl p-5 shadow bg-[#C08957] text-white">
            <div className="font-semibold text-sm">Primary (Clay)</div>
            <div className="mt-2 text-xs opacity-80">#C08957</div>
          </div>

          {/* Secondary */}
          <div className="rounded-xl p-5 shadow bg-[#8A6B47] text-white">
            <div className="font-semibold text-sm">Secondary (Deep Clay)</div>
            <div className="mt-2 text-xs opacity-80">#8A6B47</div>
          </div>

          {/* Accent */}
          <div className="rounded-xl p-5 shadow bg-[#F2D5A3] text-[#1A1A1A]">
            <div className="font-semibold text-sm">Accent (Soft Cream)</div>
            <div className="mt-2 text-xs opacity-80">#F2D5A3</div>
          </div>

          {/* Background */}
          <div className="rounded-xl p-5 shadow bg-[#FBF7F2] text-[#1A1A1A] border border-gray-200">
            <div className="font-semibold text-sm">Background</div>
            <div className="mt-2 text-xs opacity-80">#FBF7F2</div>
          </div>

          {/* Cards */}
          <div className="rounded-xl p-5 shadow bg-white text-[#1A1A1A] border border-gray-200">
            <div className="font-semibold text-sm">Card / Surface</div>
            <div className="mt-2 text-xs opacity-80">#FFFFFF</div>
          </div>

          {/* Text */}
          <div className="rounded-xl p-5 shadow bg-[#1A1A1A] text-white">
            <div className="font-semibold text-sm">Text (Charcoal)</div>
            <div className="mt-2 text-xs opacity-80">#1A1A1A</div>
          </div>

        </div>
      </div>
    </div>
  );
}
