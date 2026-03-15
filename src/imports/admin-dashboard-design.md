Design a modern, minimal Admin Dashboard UI for an education institute management system.

The design style should resemble Unacademy’s interface:
clean, professional, minimal color usage, spacious layout, clear hierarchy, and strong typography.

Use a desktop web layout (1280px width).

Global Layout Structure

The screen must use a two-column application shell layout:

Left side → Vertical Sidebar Navigation
Right side → Main Content Area

Sidebar width: ~240px
Main content fills remaining width.

The sidebar must remain fixed and persistent.

Sidebar Navigation

Minimal vertical sidebar with icons and labels.

Items in order:

Dashboard
Academic Years
Batches
Users
Teachers
Students
Tests
Attendance
Announcements
Study Materials
Profile

Design rules:

white background

subtle hover states

active item highlighted with primary color

icons + labels aligned horizontally

generous vertical spacing

Top of sidebar:

Institute logo or placeholder.

Bottom of sidebar:

Admin profile mini card.

Main Content Layout

Main content uses vertical stacked sections with generous spacing.

Sections should follow this order:

1️⃣ Page Header
2️⃣ Statistics Cards Row
3️⃣ Attendance Summary Table
4️⃣ Upcoming Tests Table
5️⃣ Announcements Feed
6️⃣ Notifications Panel

Section Details
Page Header

Top of main content.

Left side:

Admin Dashboard

Subtitle:

Overview of institute activity.

Right side:

Primary action button:

“Create Announcement”

Statistics Cards Row

Create a horizontal row of statistic cards.

Each card is minimal with a title and value.

Cards:

Total Students
Total Teachers
Active Batches
Upcoming Tests
Attendance Today

Card design:

white surface
rounded corners
soft shadow
large number value
small label above

Cards should evenly distribute across width.

Attendance Summary Table

Section title:

Attendance Overview

Table columns:

Batch
Present
Absent
Late
Date

Each row represents a batch.

Rows clickable → navigate to batch attendance details.

Upcoming Tests Table

Section title:

Upcoming Tests

Columns:

Test Name
Subject
Batch
Test Date
Created By

Rows clickable → navigate to test details.

Announcements Feed

Vertical card list showing recent announcements.

Each card contains:

Title
Short preview text
Created by
Date

Clicking an item opens Announcement Details.

Notifications Panel

Small panel showing system notifications.

Examples:

New student enrolled
Marks uploaded
Attendance completed

Each notification shown as compact row.

Visual Design Rules

Style guidelines:

Minimal UI
Clean whitespace
Flat cards
Rounded corners
Soft shadows

Typography hierarchy:

Page Title — large
Section headers — medium
Table text — normal
Metadata — small

Color palette:

Primary accent — teal / green
Background — light gray
Cards — white

Avoid excessive colors.

Interaction Expectations

Navigation:

Sidebar items switch screens.

Table rows:

Clickable to open details.

Cards:

Purely informational.

Buttons:

Primary action color.

Overall UX Goal

The dashboard should allow an admin to quickly understand the institute status:

student count

teacher count

attendance overview

upcoming tests

announcements

notifications

Everything should feel clean, structured, and professional, suitable for a school management SaaS product.