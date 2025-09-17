// src/app/demo/page.tsx
"use client";
import { useState } from 'react';
import styles from './Demo.module.css';
import Link from 'next/link';
import { T } from '@/lib/i18n-markers';

type Slide = {
  title: string;
  content: string;
  subheading?: string;
  bullets: string[];
};

export default function DemoPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      title: "Welcome to the Bupe Access Tool",
      content: "This tool helps people find and report pharmacies that fill buprenorphine prescriptions.",
      subheading: "Principles",
      bullets: [
        "Community-driven data",
        "Privacy-focused design",
        "Help others access treatment"
      ]
    },
    {
      title: "Finding Pharmacies with Bupe",
      content: "Step 1: Enter your ZIP code",
      bullets: [
        "See pharmacies within 30 miles",
        "View success/denial reports",
        "Check recent trends",
        "Print a list of pharmacies that have bupe in your area"
      ]
    },
    {
      title: "Reporting Your Experience",
      content: "Step 2: Share your experience filling a buprenorphine prescription",
      bullets: [
        "Search for your pharmacy",
        "Report success or denial",
        "Add helpful notes for others"
      ]
    }
  ];

  const currentSlideData = slides[currentSlide];

  return (
    <div className={styles.demoContainer}>
      <div className={styles.slideshow}>
        <div className={styles.slide}>
          <h2 className={styles.slideTitle}>
            <T id={`demo.slide${currentSlide}.title`}>{currentSlideData.title}</T>
          </h2>
          <p className={styles.slideContent}>
            <T id={`demo.slide${currentSlide}.content`}>{currentSlideData.content}</T>
          </p>
          {currentSlideData.subheading && (
            <h3 className={styles.slideSubheading}>
              <T id={`demo.slide${currentSlide}.subheading`}>{currentSlideData.subheading}</T>
            </h3>
          )}
          {currentSlideData.bullets && (
            <ul className={styles.slideList}>
              {currentSlideData.bullets.map((bullet, index) => (
              <li key={`slide-${currentSlide}-bullet-${index}`}>
                <T id={`demo.slide${currentSlide}.bullet${index}`}>{bullet}</T>
              </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.controls}>
          <button
            className={styles.controlButton}
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
          >
            ← Previous
          </button>
          <span>{currentSlide + 1} / {slides.length}</span>
          <button
            className={styles.controlButton}
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
