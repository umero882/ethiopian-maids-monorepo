import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Award, Loader2, MapPin, Briefcase, CheckCircle, User, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { maidService } from '@/services/maidService';
import { getMaidDisplayName } from '@/lib/displayName';

// Compact featured card for homepage carousel (industry-standard size)
const FeaturedCard = ({ maid, onClick }) => {
  const displayName = maid.full_name || maid.fullName || maid.name || getMaidDisplayName(maid);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2) || 'NA';
  const photo = maid.image || maid.profile_photo_url;
  const profession = maid.profession || maid.primary_profession || maid.primaryProfession || 'Domestic Helper';
  const experience = maid.experience_years || maid.experience || 0;
  const expDisplay = experience ? `${experience}+ yrs` : 'New';
  const isVerified = maid.verified || maid.verification_status === 'verified';
  const location = [maid.current_city || maid.city, maid.current_country || maid.country]
    .filter(Boolean)
    .join(', ') || 'GCC Region';
  const skills = (maid.skills || []).slice(0, 2);
  const salary = maid.preferred_salary_min
    ? `$${maid.preferred_salary_min.toLocaleString()}/mo`
    : 'Negotiable';

  return (
    <div
      className='bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group'
      onClick={onClick}
    >
      {/* Photo - compact landscape ratio */}
      <div className='relative h-[180px] md:h-[200px] overflow-hidden bg-gray-100'>
        {photo ? (
          <img
            src={photo}
            alt={displayName}
            className='w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500'
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        {/* Fallback placeholder */}
        <div
          className={`absolute inset-0 flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 ${photo ? 'hidden' : 'flex'}`}
        >
          <div className='w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-1'>
            <User className='w-8 h-8 text-purple-400' />
          </div>
          <span className='text-lg font-bold text-purple-400'>{initials}</span>
        </div>

        {/* Gradient overlay on photo */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />

        {/* Name + location overlay at bottom of photo */}
        <div className='absolute bottom-0 left-0 right-0 p-3'>
          <h3 className='text-white font-semibold text-sm truncate'>{displayName}</h3>
          <div className='flex items-center gap-1 text-white/80 text-xs'>
            <MapPin className='w-3 h-3 shrink-0' />
            <span className='truncate'>{location}</span>
          </div>
        </div>

        {/* Verified badge */}
        {isVerified && (
          <div className='absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1'>
            <CheckCircle className='w-3 h-3' />
            Verified
          </div>
        )}
      </div>

      {/* Info section - compact */}
      <div className='p-3'>
        {/* Profession + Experience row */}
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-1 text-gray-700 text-xs font-medium'>
            <Briefcase className='w-3 h-3 text-purple-500' />
            <span className='truncate'>{profession}</span>
          </div>
          <div className='flex items-center gap-1 text-gray-500 text-xs'>
            <Clock className='w-3 h-3' />
            <span>{expDisplay}</span>
          </div>
        </div>

        {/* Skills tags */}
        <div className='flex flex-wrap gap-1 mb-2'>
          {skills.length > 0 ? skills.map((skill, i) => (
            <span key={i} className='text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full'>
              {skill}
            </span>
          )) : (
            <span className='text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full'>
              {salary}
            </span>
          )}
          {skills.length > 0 && (
            <span className='text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full'>
              {salary}
            </span>
          )}
        </div>

        {/* View Profile button */}
        <button className='w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-all duration-200'>
          View Profile
        </button>
      </div>
    </div>
  );
};

const FeaturedMaidsSection = () => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const { user } = authContext || {};
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedMaids = async () => {
      try {
        const result = await maidService.getMaids(
          { verification_status: 'verified' },
          { page: 1, pageSize: 8, userId: user?.uid }
        );
        if (result.data && result.data.length > 0) {
          setMaids(result.data);
        }
      } catch (err) {
        console.warn('Failed to fetch featured maids:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedMaids();
  }, [user?.uid]);

  // Duplicate maids array for seamless infinite scroll loop
  const duplicatedMaids = useMemo(() => [...maids, ...maids], [maids]);

  // Duration scales with number of cards for consistent speed
  const scrollDuration = useMemo(() => Math.max(maids.length * 5, 18), [maids]);

  const handleViewAllMaids = () => {
    navigate('/maids');
  };

  return (
    <section className='py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-purple-50 overflow-hidden'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          className='text-center mb-10 md:mb-16'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className='inline-flex items-center justify-center px-4 py-2 bg-purple-100 rounded-full mb-6'>
            <Award className='w-5 h-5 text-purple-600 mr-2' />
            <span className='text-purple-700 font-semibold text-sm'>
              Premium Profiles
            </span>
          </div>
          <h2 className='text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6'>
            Meet Our{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600'>
              Featured Maids
            </span>
          </h2>
          <p className='text-base md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
            Handpicked, verified professionals with exceptional skills and
            experience, ready to become trusted members of your family.
          </p>
        </motion.div>

        {/* Infinite Scrolling Compact Cards */}
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
            <span className='ml-3 text-gray-500'>Loading featured maids...</span>
          </div>
        ) : maids.length > 0 ? (
          <div className='relative overflow-hidden'>
            <motion.div
              className='flex gap-4 shrink-0'
              animate={{
                x: ['0%', '-50%'],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: scrollDuration,
                  ease: 'linear',
                },
              }}
            >
              {duplicatedMaids.map((maid, index) => (
                <div
                  key={`${maid.id}-${index}`}
                  className='shrink-0 w-[220px] sm:w-[240px] md:w-[260px]'
                >
                  <FeaturedCard
                    maid={maid}
                    onClick={() => navigate(`/maid/${maid.id}`)}
                  />
                </div>
              ))}
            </motion.div>

            {/* Gradient overlays for smooth fade effect */}
            <div className='absolute top-0 left-0 w-10 md:w-16 h-full bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-10'></div>
            <div className='absolute top-0 right-0 w-10 md:w-16 h-full bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-10'></div>
          </div>
        ) : (
          <div className='text-center py-12 text-gray-500'>
            No featured maids available at the moment.
          </div>
        )}

        {/* Call to Action */}
        <motion.div
          className='text-center mt-10 md:mt-16'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Button
            size='lg'
            onClick={handleViewAllMaids}
            className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105'
          >
            Browse All Maids
            <ArrowRight className='w-5 h-5 ml-2' />
          </Button>
          <p className='text-gray-600 mt-4 text-sm'>
            Discover over 1,000+ verified domestic workers ready to join your
            family
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedMaidsSection;
