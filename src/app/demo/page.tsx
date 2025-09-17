// src/app/demo/page.tsx
"use client";
import React from 'react';
import { useState, useCallback } from 'react';
import styles from './Demo.module.css';
import Link from 'next/link';
import { T } from '@/lib/i18n-markers';

export default function DemoPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handlePrevPage = useCallback(() => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentSlide(prev => Math.min(2, prev + 1));
  }, []);
  // Render slide content directly in JSX with T components
  const renderSlide = (slideIndex: number) => {
    switch (slideIndex) {
      case 0:
        return (
          <>
            <h2 className={styles.slideTitle}>
              <T id="demo.slide0.title">Welcome to the Bupe Access Tool</T>
            </h2>
            <p className={styles.slideContent}>
              <T id="demo.slide0.content">This tool helps people find and report pharmacies that fill buprenorphine prescriptions.</T>
            </p>
            <h3 className={styles.slideSubheading}>
              <T id="demo.slide0.subheading">Principles</T>
            </h3>
            <ul className={styles.slideList}>
              <li className={styles.slideListItem}><T id="demo.slide0.bullet0">Community-driven data</T></li>
              <li className={styles.slideListItem}><T id="demo.slide0.bullet1">Privacy-focused design</T></li>
              <li className={styles.slideListItem}><T id="demo.slide0.bullet2">Help others access treatment</T></li>
            </ul>
          </>
        );
      case 1:
        return (
          <>
            <h2 className={styles.slideTitle}>
              <T id="demo.slide1.title">Finding Pharmacies with Bupe</T>
            </h2>
            <p className={styles.slideContent}>
              <T id="demo.slide1.content">Step 1: Enter your ZIP code</T>
            </p>
            <ul className={styles.slideList}>
              <li className={styles.slideListItem}><T id="demo.slide1.bullet0">See pharmacies within 30 miles</T></li>
              <li className={styles.slideListItem}><T id="demo.slide1.bullet1">View success/denial reports</T></li>
              <li className={styles.slideListItem}><T id="demo.slide1.bullet2">Check recent trends</T></li>
              <li className={styles.slideListItem}><T id="demo.slide1.bullet3">Print a list of pharmacies that have bupe in your area</T></li>
            </ul>
          </>
        );
      case 2:
        return (
          <>
            <h2 className={styles.slideTitle}>
              <T id="demo.slide2.title">Reporting Your Experience</T>
            </h2>
            <p className={styles.slideContent}>
              <T id="demo.slide2.content">Step 2: Share your experience filling a buprenorphine prescription</T>
            </p>
            <ul className={styles.slideList}>
              <li className={styles.slideListItem}><T id="demo.slide2.bullet0">Search for your pharmacy</T></li>
              <li className={styles.slideListItem}><T id="demo.slide2.bullet1">Report success or denial</T></li>
              <li className={styles.slideListItem}><T id="demo.slide2.bullet2">Add helpful notes for others</T></li>
            </ul>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.demoContainer}>
      <div className={styles.slideshow}>
        <div className={styles.slide}>
          {renderSlide(currentSlide)}
        </div>
          <div className={styles.controls}>
            <button
              className={styles.controlButton}
              onClick={handlePrevPage}
              disabled={currentSlide === 0}
            >
              <T id="demo.controls.previous">← Previous</T>
            </button>
            <span>{currentSlide + 1} / 3</span>
            <button
              className={styles.controlButton}
              onClick={handleNextPage}
              disabled={currentSlide >= 2}
            >
              <T id="demo.controls.next">Next →</T>
            </button>
          </div>
      </div>
      <Link href="/" className={styles.startButton}>
        <T id="demo.startButton">Start Using the Tool</T>
      </Link>
    </div>
  );
}
