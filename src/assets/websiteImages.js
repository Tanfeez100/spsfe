import schoolLogo from './logo.png'
import websiteTechIcon from './react.svg'

import home1 from './home1.jpeg'
import home2 from './home2.jpeg'
import home3 from './home3.jpeg'
import home4 from './home4.jpeg'
import gallery from './gallery.jpeg'
import gallery1 from './gallery1.jpeg'
import im1 from './im1.jpeg'
import moments from './moments.jpeg'
import moments1 from './moments1.jpeg'
import moments2 from './moments 2.jpeg'
import m3 from './m3.jpeg'
import m4 from './m4.jpeg'
import m5 from './m5.jpeg'
import m6 from './m6.jpeg'
import m7 from './m7.jpeg'
import m8 from './m8.jpeg'
import m9 from './m9.jpeg'
import celeb from './celeb.jpeg'
import teacher2 from './teacher2.jpeg'
import t3 from './t3.jpeg'
import campusWide from './WhatsApp Image 2026-05-28 at 4.33.37 PM.jpeg'
import campusPortrait from './WhatsApp Image 2026-05-28 at 4.33.37 PM (1).jpeg'
import campusActivity from './WhatsApp Image 2026-05-28 at 4.33.36 PM.jpeg'

export const sharedImages = {
  schoolLogo,
  websiteTechIcon,
}

export const campusPhotos = [
  { id: 'home-assembly', src: home1, title: 'Morning Assembly', orientation: 'landscape' },
  { id: 'home-classroom', src: home2, title: 'Classroom Session', orientation: 'landscape' },
  { id: 'home-activity', src: home3, title: 'Student Activity', orientation: 'landscape' },
  { id: 'home-campus', src: home4, title: 'Campus Life', orientation: 'landscape' },
  { id: 'gallery-main', src: gallery, title: 'School Gallery', orientation: 'landscape' },
  { id: 'gallery-learning', src: gallery1, title: 'Learning Moment', orientation: 'landscape' },
  { id: 'campus-im1', src: im1, title: 'Student Participation', orientation: 'landscape' },
  { id: 'moments-main', src: moments, title: 'School Moment', orientation: 'landscape' },
  { id: 'moments-one', src: moments1, title: 'Campus Moment', orientation: 'landscape' },
  { id: 'moments-two', src: moments2, title: 'Group Activity', orientation: 'landscape' },
  { id: 'm3', src: m3, title: 'Academic Activity', orientation: 'landscape' },
  { id: 'm4', src: m4, title: 'Student Showcase', orientation: 'landscape' },
  { id: 'm5', src: m5, title: 'Classroom Focus', orientation: 'landscape' },
  { id: 'm6', src: m6, title: 'Team Learning', orientation: 'landscape' },
  { id: 'm7', src: m7, title: 'School Program', orientation: 'landscape' },
  { id: 'm8', src: m8, title: 'Campus Program', orientation: 'landscape' },
  { id: 'm9', src: m9, title: 'Achievement Day', orientation: 'landscape' },
  { id: 'celebration', src: celeb, title: 'Celebration', orientation: 'landscape' },
  { id: 'teacher-guidance', src: teacher2, title: 'Teacher Guidance', orientation: 'landscape' },
  { id: 'teacher-team', src: t3, title: 'Faculty Moment', orientation: 'landscape' },
  { id: 'campus-wide', src: campusWide, title: 'Campus View', orientation: 'landscape' },
  { id: 'campus-portrait', src: campusPortrait, title: 'Student Portrait', orientation: 'portrait' },
  { id: 'campus-activity', src: campusActivity, title: 'Campus Activity', orientation: 'landscape' },
]

export const homeHeroSlides = [home1, home2, home4, gallery, moments, celeb]

export const homeFeaturePhotos = [teacher2, t3, campusPortrait]

export const aboutPhotos = {
  hero: campusWide,
  secondary: teacher2,
  journey: moments1,
  achievements: celeb,
  principal: t3,
}

export const contactPhotos = {
  hero: campusActivity,
  location: home4,
}
