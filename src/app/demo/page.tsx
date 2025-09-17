// src/app/demo/page.tsx
"use client";
import { useState, useEffect } from 'react';
import styles from './Demo.module.css';
import Link from 'next/link';
import { T } from '@/lib/i18n-markers';

type Slide = {
  title: React.ReactNode;
  content: React.ReactNode;
  subheading?: React.ReactNode;
  bullets: React.ReactNode[];
};

export default function DemoPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Define slides outside the component function to prevent recreation on each render
  const slides: Slide[] = [
    {
      title: <T id="demo.welcome.title">Welcome to the Bupe Access Tool</T>,
      content: <T id="demo.welcome.content">This tool helps people find and report pharmacies that fill buprenorphine prescriptions.</T>,
      subheading: <T id="demo.welcome.subheading">Principles</T>,
      bullets: [
        <T id="demo.welcome.bullet1" key="bullet1">Community-driven data</T>,
        <T id="demo.welcome.bullet2" key="bullet2">Privacy-focused design</T>,
        <T id="demo.welcome.bullet3" key="bullet3">Help others access treatment</T>
      ]
    },
    {
      title: <T id="demo.finding.title">Finding Pharmacies</T>,
      content: <T id="demo.finding.content">Step 1: Enter your ZIP code</T>,
      bullets: [
        <T id="demo.finding.bullet1" key="bullet1">See pharmacies within 30 miles</T>,
        <T id="demo.finding.bullet2" key="bullet2">View success/denial reports</T>,
        <T id="demo.finding.bullet3" key="bullet3">Check recent trends</T>
      ]
    },
    {
      title: <T id="demo.reporting.title">Reporting Your Experience</T>,
      content: <T id="demo.reporting.content">Step 2: Share if you could fill your prescription</T>,
      bullets: [
        <T id="demo.reporting.bullet1" key="bullet1">Search for your pharmacy</T>,
        <T id="demo.reporting.bullet2" key="bullet2">Report success or denial</T>,
        <T id="demo.reporting.bullet3" key="bullet3">Add helpful notes for others</T>
      ]
    },
    {
      title: <T id="demo.privacy.title">Privacy Protected</T>,
      content: <T id="demo.privacy.content">Your privacy is our priority</T>,
      bullets: [
        <T id="demo.privacy.bullet1" key="bullet1">No personal information collected</T>,
        <T id="demo.privacy.bullet2" key="bullet2">No IP address tracking</T>,
        <T id="demo.privacy.bullet3" key="bullet3">Anonymous reporting only</T>
      ]
    }
  ];

  // Ensure currentSlide is within bounds
  useEffect(() => {
    if (currentSlide < 0) {
      setCurrentSlide(0);
    } else if (currentSlide >= slides.length) {
      setCurrentSlide(slides.length - 1);
    }
  }, [currentSlide, slides.length]);

  const currentSlideData = slides[currentSlide] || slides[0]; // Fallback to first slide if currentSlide is invalid

  return (
    <div className={styles.demoContainer}>
      <div className={styles.slideshow}>
        <div className={styles.slide}>
          {currentSlideData.title && currentSlideData.title}
          <p>{currentSlideData.content && currentSlideData.content}</p>
          {currentSlideData.subheading && <h4 className={styles.subheading}>{currentSlideData.subheading}</h4>}
          {currentSlideData.bullets && (
            <ul>
              {Array.isArray(currentSlideData.bullets) && currentSlideData.bullets.map((bullet, index) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.controls}>
          <button
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
          >
            ← Previous
          </button>
          <span>{currentSlide + 1} / {slides.length}</span>
          <button
            onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide >= slides.length - 1}
          >
            Next →
          </button>
        </div>
      </div>

      <Link href="/" className={styles.startButton}>
        <T>Start Using the Tool</T>
      </Link>
    </div>
  );
}
