import React, { useState, useRef } from 'react';
import type { Doubt } from '../types';
import { UsersIcon } from './icons/UsersIcon';

interface DoubtCardProps {
  doubt: Doubt;
  onJoin: (doubt: Doubt) => void;
}

const DoubtCard: React.FC<DoubtCardProps> = ({ doubt, onJoin }) => {
  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300">
      {doubt.imageUrl && (
        <div className="mb-4">
          <img
            src={doubt.imageUrl}
            alt="Doubt attachment"
            className="w-full h-40 object-cover rounded-md border border-slate-700/70"
          />
        </div>
      )}
      <div>
        <h3 className="font-bold text-slate-100 text-lg">{doubt.title}</h3>
        <p className="text-sm text-slate-400 mt-2 mb-4">{doubt.description}</p>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <div className="flex items-center gap-2">
            <UsersIcon />
            <span>{doubt.participants} mentees discussing</span>
        </div>
        <button 
            onClick={() => onJoin(doubt)}
            className="px-4 py-1.5 font-semibold rounded-md shadow-sm text-brand-accent bg-brand-light/50 hover:bg-brand-light transition-all duration-300"
        >
          Join
        </button>
      </div>
    </div>
  );
};

interface DoubtRoomViewProps {
  doubts: Doubt[];
  onJoinDoubt: (doubt: Doubt) => void;
  onCreateDoubt: (title: string, description: string, imageUrl?: string) => void;
}

export const DoubtRoomView: React.FC<DoubtRoomViewProps> = ({ doubts, onJoinDoubt, onCreateDoubt }) => {
  const [newDoubtTitle, setNewDoubtTitle] = useState('');
  const [newDoubtDesc, setNewDoubtDesc] = useState('');
  const [newDoubtImage, setNewDoubtImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCreateDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDoubtTitle.trim() && newDoubtDesc.trim()) {
      onCreateDoubt(newDoubtTitle, newDoubtDesc, newDoubtImage || undefined);
      setNewDoubtTitle('');
      setNewDoubtDesc('');
      setNewDoubtImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setNewDoubtImage(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewDoubtImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setNewDoubtImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 mb-8">
        <h2 className="text-2xl font-bold text-slate-100">Create a New Doubt Room</h2>
        <p className="text-slate-400 mt-1 mb-4">Have a question? Start a discussion and get help from your peers.</p>
        <form onSubmit={handleCreateDoubt} className="space-y-4">
          <div className="relative">
            <label htmlFor="doubt-title" className="sr-only">Doubt Title</label>
            <input
              id="doubt-title"
              type="text"
              value={newDoubtTitle}
              onChange={(e) => setNewDoubtTitle(e.target.value)}
              placeholder="What's your question?"
              className="block w-full px-3 py-2 pr-12 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              required
            />
            <button
              type="button"
              onClick={handleTriggerUpload}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-lg font-bold text-brand-accent hover:text-white"
              aria-label="Attach reference image"
            >
              +
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          {newDoubtImage && (
            <div className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-700/60 border border-slate-600 rounded-md">
              <div className="flex items-center gap-3">
                <img
                  src={newDoubtImage}
                  alt="Selected reference"
                  className="h-12 w-12 object-cover rounded-md border border-slate-600/70"
                />
                <span className="text-xs text-slate-300">Image ready to upload</span>
              </div>
              <button
                type="button"
                onClick={handleClearImage}
                className="text-xs font-semibold text-brand-accent hover:text-white"
              >
                Remove
              </button>
            </div>
          )}
          <div>
            <label htmlFor="doubt-desc" className="sr-only">Description</label>
            <textarea
              id="doubt-desc"
              rows={3}
              value={newDoubtDesc}
              onChange={(e) => setNewDoubtDesc(e.target.value)}
              placeholder="Add more details here..."
              className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              required
            />
          </div>
          <div className="text-right">
            <button
              type="submit"
              className="px-6 py-2 font-semibold rounded-lg shadow-md text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-dark hover:to-brand-primary transition-all duration-300 disabled:opacity-50"
              disabled={!newDoubtTitle.trim() || !newDoubtDesc.trim()}
            >
              Create Room
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Active Discussions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doubts.map(doubt => (
            <DoubtCard key={doubt.id} doubt={doubt} onJoin={onJoinDoubt} />
          ))}
        </div>
      </div>
    </div>
  );
};
