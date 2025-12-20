'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import NetworkBackground from '@/components/NetworkBackground';
import { updateUserProfile } from '@/app/actions';

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [orcid, setOrcid] = useState('');
  const [homeInstitution, setHomeInstitution] = useState('');
  const [nationality, setNationality] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setOrcid(user.orcid || '');
      setHomeInstitution(user.homeInstitution || '');
      setNationality(user.nationality || '');
      setAge(user.age?.toString() || '');
      setGender(user.gender || '');
      setResearchInterests(user.researchInterests || []);
    }
  }, [user]);

  const handleAddInterest = () => {
    if (newInterest.trim() && !researchInterests.includes(newInterest.trim())) {
      setResearchInterests([...researchInterests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setResearchInterests(researchInterests.filter(i => i !== interest));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await updateUserProfile(user.id, {
        username,
        orcid: orcid || undefined,
        homeInstitution: homeInstitution || undefined,
        nationality: nationality || undefined,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
        researchInterests,
      });

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NetworkBackground />
        <div className="relative z-10 text-xl font-medium text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NetworkBackground />
      <div className="relative z-10">
        <Navbar />

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-10 animate-scale-in">
            <h1 className="text-4xl font-black mb-8 text-gray-800 border-b border-gray-200/60 pb-4">
              Account Settings
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-5 py-3 border border-gray-200 rounded-xl bg-gray-100/50 text-gray-500 cursor-not-allowed font-medium"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-1">Email address needs verified access to change.</p>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/70 backdrop-blur-sm outline-none font-medium text-gray-800"
                />
              </div>

              {/* ORCID */}
              <div>
                <label htmlFor="orcid" className="block text-sm font-bold text-gray-700 mb-2">
                  ORCID (Optional)
                </label>
                <div className="relative">
                  <input
                    id="orcid"
                    type="text"
                    value={orcid}
                    onChange={(e) => setOrcid(e.target.value)}
                    placeholder="0000-0000-0000-0000"
                    className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/70 backdrop-blur-sm outline-none font-medium text-gray-800 pl-12"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-green-600 font-bold text-xs bg-green-50 m-2 rounded px-1 border border-green-100">
                    iD
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1">
                  Connect your research identity to highlight your publications.
                </p>
              </div>

              {/* Home Institution */}
              <div>
                <label htmlFor="homeInstitution" className="block text-sm font-bold text-gray-700 mb-2">
                  Home Institution
                </label>
                <input
                  id="homeInstitution"
                  type="text"
                  value={homeInstitution}
                  onChange={(e) => setHomeInstitution(e.target.value)}
                  placeholder="University or Research Institution"
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/70 backdrop-blur-sm outline-none font-medium text-gray-800"
                />
              </div>

              {/* Nationality */}
              <div>
                <label htmlFor="nationality" className="block text-sm font-bold text-gray-700 mb-2">
                  Nationality
                </label>
                <input
                  id="nationality"
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Your nationality"
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/70 backdrop-blur-sm outline-none font-medium text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Age */}
                <div>
                  <label htmlFor="age" className="block text-sm font-bold text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="18"
                    max="120"
                    placeholder="25"
                    className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/70 backdrop-blur-sm outline-none font-medium text-gray-800"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-bold text-gray-700 mb-2">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/70 backdrop-blur-sm outline-none font-medium text-gray-800 appearance-none"
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Interests */}
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Research Interests
                </label>
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                    placeholder="Add research interest..."
                    className="flex-1 px-5 py-3 border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white outline-none font-medium text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {researchInterests.length === 0 && (
                    <span className="text-gray-400 italic text-sm py-2">No interests added yet.</span>
                  )}
                  {researchInterests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-blue-200 text-blue-700 text-sm font-bold shadow-sm"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(interest)}
                        className="ml-2 text-blue-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-blue-800/60 mt-3 font-medium">
                  We typically recommend papers based on these topics.
                </p>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl text-sm font-bold animate-slide-down flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm font-bold animate-shake flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-4 pt-4 border-t border-gray-200/50">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/home')}
                  className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
