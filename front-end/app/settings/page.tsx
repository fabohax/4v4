'use client';

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tagline, setTagline] = useState('');
  const [biography, setBiography] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  // New state for links
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [savingLinks, setSavingLinks] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate save
    setTimeout(() => setSaving(false), 1000);
  };

  const handleSaveLinks = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLinks(true);
    // Simulate save
    setTimeout(() => setSavingLinks(false), 1000);
  };

  return (
    <div className="max-w-xl mx-auto my-24 p-8 bg-black rounded-2xl border-[1px] border-[#333] shadow text-white">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block mb-2 text-sm font-semibold">Username</label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] focus:outline-none"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Your username"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold">Email</label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] focus:outline-none"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </div>
        {/* New fields */}
        <div>
          <label className="block mb-2 text-sm font-semibold">Display name</label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] focus:outline-none"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Display name"
          />
          <div className="text-xs text-[#aaa] mt-1">
            This is the name that people will see when they visit your public profile.
          </div>
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold">Your tagline</label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] focus:outline-none"
            type="text"
            value={tagline}
            onChange={e => setTagline(e.target.value)}
            placeholder="Your tagline"
            maxLength={138}
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold">Your biography</label>
          <textarea
            className="w-full px-4 py-2 rounded-xl border border-[#333] focus:outline-none"
            value={biography}
            onChange={e => setBiography(e.target.value)}
            placeholder="Write a little more about yourself"
            maxLength={256}
            rows={3}
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold">Your location</label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] focus:outline-none"
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Your location"
          />
        </div>
        <div>
        <label className="block mb-2 text-sm font-semibold">Website</label>
        <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] focus:outline-none"
            type="url"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com"
        />
        </div>
        <div>
        <label className="block mb-2 text-sm font-semibold">Twitter</label>
        <input
            className="w-full px-4 py-2 rounded-xl border border-[#333] focus:outline-none"
            type="text"
            value={twitter}
            onChange={e => setTwitter(e.target.value)}
            placeholder="@yourtwitter"
        />
        </div>
        {/* Add Software & Skills section */}
        <div>
          <label className="block mb-2 text-sm font-semibold">Software &amp; skills</label>
          {/* You can replace the below with a dynamic list if needed */}
          <div className="flex flex-wrap gap-2">
            {[
              "3D-Coat", "3D Reconstruction", "3ds Max", "ArchiCAD", "AutoCAD",
              "Blender", "Cinema 4D", "Cubik", "form-Z", "GIMP", "Houdini",
              "Inventor", "IronCAD", "Lightwave 3D", "MagicaVoxel", "Maya",
              "Minecraft", "Modo", "Mudbox", "Photogrammetry", "Photoshop",
              "Qubicle", "Revit", "Rhino", "Sculpt+", "Sculptris", "SketchUp",
              "Softimage", "SolidWorks", "Strata", "Substance", "Unity", "Unreal",
              "Voxel", "Vray", "ZBrush"
            ].map((skill) => (
              <span
                key={skill}
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                  [
                    "3ds Max", "ArchiCAD", "AutoCAD", "Blender", "GIMP",
                    "Minecraft", "Photogrammetry", "Photoshop", "Revit", "Rhino", "SketchUp", "Vray"
                  ].includes(skill)
                    ? "bg-[#444] text-white"
                    : "bg-[#222] text-[#bbb]"
                }`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl border-[1px] border-[#333] bg-black hover:bg-white hover:text-black transition-all duration-200 focus:outline-none cursor-pointer select-none"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>



      {/* New Links Section */}
      <div className="mt-12">
              <div className="mt-2 flex justify-center">
        <Link
          href="/settings/password"
          className="w-full text-center py-3 px-4 rounded-xl border-[1px] border-[#333] bg-black hover:bg-white hover:text-black transition-all duration-200 focus:outline-none cursor-pointer select-none"
        >
          Change Password
        </Link>
      </div>
            <div className="mt-2 flex justify-center">
        <Link
          href="/settings/api/delete"
          className="w-full text-center text-rose-500 py-3 px-4 rounded-xl border-[1px] border-[#333] bg-black hover:bg-white transition-all duration-200 focus:outline-none cursor-pointer select-none"
        >
          Delete Account
        </Link>
      </div>
      </div>
    </div>
  );
}