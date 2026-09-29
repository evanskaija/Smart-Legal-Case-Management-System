-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: slcm_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `slcm_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `slcm_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `slcm_db`;

--
-- Table structure for table `case_assigned_users`
--

DROP TABLE IF EXISTS `case_assigned_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_assigned_users` (
  `case_id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  PRIMARY KEY (`case_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `case_assigned_users`
--

LOCK TABLES `case_assigned_users` WRITE;
/*!40000 ALTER TABLE `case_assigned_users` DISABLE KEYS */;
INSERT INTO `case_assigned_users` VALUES ('case-001','usr-002'),('case-001','usr-004'),('case-002','usr-003'),('case-101','usr-001'),('case-101','usr-002'),('CASE-2025-001','usr-001'),('CASE-2025-001','usr-002'),('CASE-2025-001','usr-003'),('CASE-2025-002','usr-001'),('CASE-2025-002','usr-003'),('CASE-2025-002','usr-004'),('CASE-2025-003','usr-001'),('CASE-2025-003','usr-002'),('CASE-2025-003','usr-005'),('CASE-2025-004','usr-001'),('CASE-2025-004','usr-002'),('CASE-2025-004','usr-003'),('CASE-2025-004','usr-004'),('CASE-2025-004','usr-005');
/*!40000 ALTER TABLE `case_assigned_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `case_assignments`
--

DROP TABLE IF EXISTS `case_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_assignments` (
  `id` varchar(50) NOT NULL,
  `case_id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `assigned_role` varchar(50) DEFAULT NULL,
  `assigned_by` varchar(50) DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_asg_case` (`case_id`),
  KEY `idx_asg_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `case_assignments`
--

LOCK TABLES `case_assignments` WRITE;
/*!40000 ALTER TABLE `case_assignments` DISABLE KEYS */;
INSERT INTO `case_assignments` VALUES ('asg-001','CASE-2025-001','usr-002','Lead Counsel','usr-001','2026-09-24 05:39:11'),('asg-002','CASE-2025-001','usr-003','Co-Counsel','usr-001','2026-09-24 05:39:11'),('asg-003','CASE-2025-002','usr-003','Lead Counsel','usr-001','2026-09-24 05:39:11'),('asg-004','CASE-2025-003','usr-002','Lead Counsel','usr-001','2026-09-24 05:39:11'),('asg-005','CASE-2025-004','usr-002','Lead Counsel','usr-001','2026-09-24 05:39:11'),('asg-006','case-001','usr-002','Lead Counsel','usr-001','2026-09-24 05:39:11'),('asg-007','case-002','usr-003','Lead Counsel','usr-001','2026-09-24 05:39:11'),('asg-008','case-101','usr-002','Lead Counsel','usr-001','2026-09-24 05:39:11');
/*!40000 ALTER TABLE `case_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `case_progress`
--

DROP TABLE IF EXISTS `case_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_progress` (
  `id` varchar(50) NOT NULL,
  `case_id` varchar(50) NOT NULL,
  `stage_name` varchar(100) NOT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` varchar(150) DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_progress_case` (`case_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `case_progress`
--

LOCK TABLES `case_progress` WRITE;
/*!40000 ALTER TABLE `case_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `case_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cases`
--

DROP TABLE IF EXISTS `cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cases` (
  `id` varchar(50) NOT NULL,
  `case_number` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `case_title` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `case_type` varchar(50) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'ACTIVE',
  `client_id` varchar(50) DEFAULT NULL,
  `client_name` varchar(150) DEFAULT NULL,
  `court` varchar(150) DEFAULT NULL,
  `registry` varchar(150) DEFAULT NULL,
  `lead_counsel_id` varchar(50) DEFAULT NULL,
  `lead_counsel` varchar(150) DEFAULT NULL,
  `judge_coram` varchar(150) DEFAULT NULL,
  `next_hearing_date` varchar(50) DEFAULT NULL,
  `filing_date` varchar(50) DEFAULT NULL,
  `opposing_party` varchar(150) DEFAULT NULL,
  `opposing_counsel` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_sensitive` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `case_number` (`case_number`),
  KEY `idx_case_num` (`case_number`),
  KEY `idx_case_status` (`status`),
  KEY `idx_case_client` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cases`
--

LOCK TABLES `cases` WRITE;
/*!40000 ALTER TABLE `cases` DISABLE KEYS */;
INSERT INTO `cases` VALUES ('case-001','CV/2026/0042','Kilombero Sugar Co. Ltd v Mara Logistics Ltd','Kilombero Sugar Co. Ltd v Mara Logistics Ltd','Commercial Law','COMMERCIAL','ACTIVE','cli-004','Kilombero Sugar Co. Ltd','High Court Commercial Division','Dar es Salaam Commercial Registry','usr-002','Adv. Asha Mrema','Justice Kwariko','2026-09-28','2026-01-18','Mara Logistics Ltd','Adv. Frank Kimaro','Breach of haulage contract and claim for liquidated damages.',0,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('case-002','PC Civil Appeal No. 69 of 2018','Abdallah Salum Muwinge v Halima Ismail','Abdallah Salum Muwinge v Halima Ismail','Civil Appeal / Matrimonial Property','CIVIL','ACTIVE','client-act-001','Halima Ismail','High Court of Tanzania','Dar es Salaam District Registry','usr-003','Adv. Baraka Juma','Judge Masoud','2026-09-25','2018-05-10','Abdallah Salum Muwinge','Adv. Kassim Ally','Appeal regarding distribution of matrimonial properties under Islamic Law.',0,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('case-101','CV/2026/0142','Commercial Bank vs Kivukoni Traders','Commercial Bank vs Kivukoni Traders','Banking & Recovery','COMMERCIAL','ACTIVE','client-act-003','Commercial Bank of Africa','High Court Commercial Division','Dar es Salaam Commercial Registry Courtroom 3','usr-002','Adv. Asha Mrema','Hon. Deputy Registrar','2026-10-06','2026-02-01','Kivukoni Traders','Adv. Robert Lyimo','Recovery of commercial overdraft facility, security realization, and interim injunction.',0,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('CASE-2025-001','Criminal Appeal No. 30 of 2021','Deogratius Peter Shayo v. Republic','Deogratius Peter Shayo v. Republic','Criminal Law / Sexual Offence','CRIMINAL','CLOSED','cli-001','Deogratius Peter Shayo','Court of Appeal of Tanzania','Dar es Salaam Appellate Registry','usr-002','Adv. Asha Mrema','Hon. Justices of Appeal','2026-11-10','2021-04-15','Republic','State Attorney Chambers','Appeal against conviction and sentence under Penal Code.',1,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('CASE-2025-002','Land Revision No. 31364 of 2024','Neema Benson Shabani v. Ramadhani Juma Mpanda','Neema Benson Shabani v. Ramadhani Juma Mpanda','Land Law / Limitation','LAND','CLOSED','cli-002','Neema Benson Shabani','High Court of Tanzania (Land Division)','Dar es Salaam Land Registry','usr-003','Adv. Baraka Juma','Justice Mchome','2026-10-18','2024-06-20','Ramadhani Juma Mpanda','Adv. David Croft','Land revision petition concerning adverse possession and boundary survey.',0,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('CASE-2025-003','DC Criminal Revision No. 000006375 of 2025','Peter Thomas Bocco v. Republic','Peter Thomas Bocco v. Republic','Criminal Revision / Evidence','CRIMINAL','ACTIVE','cli-001','Peter Thomas Bocco','Resident Magistrate Court of Ilala','Ilala District Registry','usr-002','Adv. Asha Mrema','Resident Magistrate Mwacha','2026-10-24','2025-01-12','Republic','Ilala Prosecution Directorate','Application for revision on admission of documentary evidence.',0,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('CASE-2025-004','Misc. Civil Application No. 7327 of 2025','Rogath K. Katende v. CRDB Bank PLC & Others','Rogath K. Katende v. CRDB Bank PLC & Others','Commercial / Banking / Extension of Time','COMMERCIAL','ACTIVE','cli-003','CRDB Bank PLC','High Court Commercial Division','Commercial Division Registry','usr-002','Adv. Asha Mrema','Justice Mwambegele','2026-10-12','2025-03-05','Rogath K. Katende','Adv. Eleanor Vance','Notice of motion seeking extension of time to file statement of defence.',0,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('CASE-2025-005','Tax Appeal No. 18 of 2026','Tanzania Revenue Authority v. Kilombero Sugar Co. Ltd','Tanzania Revenue Authority v. Kilombero Sugar Co. Ltd','Corporate & Tax Advisory','TAX','UNASSIGNED','cli-004','Kilombero Sugar Co. Ltd','Tax Appeals Tribunal of Tanzania','Dar es Salaam Tax Registry','usr-003','Adv. Baraka Juma','Tribunal Chairman','2026-11-04','2026-02-14','Tanzania Revenue Authority','TRA Legal Directorate','Dispute over capital expenditure deductions and VAT withholding.',0,'2026-09-24 05:39:11','2026-09-24 05:39:11');
/*!40000 ALTER TABLE `cases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clients` (
  `id` varchar(50) NOT NULL,
  `client_number` varchar(50) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `client_type` varchar(50) DEFAULT 'INDIVIDUAL',
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `national_id_ref` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'ACTIVE',
  `contact_person` varchar(150) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_number` (`client_number`),
  KEY `idx_client_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES ('cli-001','CLI-TZ-2025-001','Deogratius Peter Shayo','INDIVIDUAL','deogratius.shayo@example.com','+255754112233','NIDA-19850101-1001-11','Dar es Salaam, Kinondoni','ACTIVE','Deogratius Peter Shayo',NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('cli-002','CLI-TZ-2025-002','Neema Benson Shabani','INDIVIDUAL','neema.shabani@example.com','+255765223344','NIDA-19900202-2002-22','Dar es Salaam, Ilala','ACTIVE','Neema Benson Shabani',NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('cli-003','CLI-TZ-2025-003','CRDB Bank PLC','CORPORATE','legal@crdbbank.co.tz','+255754000001','BRELA-1002341','Azikiwe Street, Dar es Salaam','ACTIVE','Director of Legal Services',NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('cli-004','CLI-TZ-2025-004','Kilombero Sugar Co. Ltd','CORPORATE','info@kilomberosugar.co.tz','+255754000002','BRELA-1005882','Morogoro, Tanzania','ACTIVE','Company Secretary',NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('client-act-001','CLI-TZ-2025-005','Halima Ismail','INDIVIDUAL','halima@example.com','+255 754 889 900','19880412-1410-00021','Plot 44, Msimbazi Street, Kariakoo, Dar es Salaam','ACTIVE','Halima Ismail',NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('client-act-003','CLI-TZ-2025-006','Bank of Africa Tanzania','CORPORATE','recoveries@bankofafrica.co.tz','+255 22 211 0000','TIN-102-441-998','Bank of Africa Tower, Ali Hassan Mwinyi Road, Dar es Salaam','ACTIVE','Head of Recoveries & Litigation',NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('client-act-004','CLI-TZ-2025-007','Serengeti Breweries Ltd','CORPORATE','compliance@serengetibreweries.co.tz','+255 765 443 322','TIN-103-998-112','Chang\'ombe Industrial Area, Dar es Salaam','ACTIVE','Corporate Affairs Director',NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `communications`
--

DROP TABLE IF EXISTS `communications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `communications` (
  `id` varchar(50) NOT NULL,
  `message_id` varchar(100) DEFAULT NULL,
  `case_id` varchar(50) DEFAULT NULL,
  `case_number` varchar(100) DEFAULT NULL,
  `case_title` varchar(255) DEFAULT NULL,
  `client_id` varchar(50) DEFAULT NULL,
  `client_name` varchar(150) DEFAULT NULL,
  `message_type` varchar(100) DEFAULT NULL,
  `channel` varchar(50) DEFAULT 'Email',
  `sender` varchar(150) DEFAULT NULL,
  `recipient` varchar(150) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message_body` text DEFAULT NULL,
  `language` varchar(50) DEFAULT 'English',
  `status` varchar(50) DEFAULT 'SENT',
  `prepared_by` varchar(150) DEFAULT NULL,
  `approved_by` varchar(150) DEFAULT NULL,
  `sent_by` varchar(150) DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `gmail_message_id` varchar(150) DEFAULT NULL,
  `provider_reference` varchar(150) DEFAULT NULL,
  `failure_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_comm_case` (`case_id`),
  KEY `idx_comm_client` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `communications`
--

LOCK TABLES `communications` WRITE;
/*!40000 ALTER TABLE `communications` DISABLE KEYS */;
INSERT INTO `communications` VALUES ('msg-1790079160943-28e3',NULL,'case-101','CV/2026/0142','Commercial Bank vs Kivukoni Traders',NULL,'Adv. Asha Mrema','Docket Alert','Email',NULL,'asha.mrema@slcms-law.com','[SLCMS Docket Alert] Action Required: Draft Statement of Defence (CV/2026/0142)','STATUTORY DEADLINE NOTICE - Case Ref: CV/2026/0142 - Commercial Bank vs Kivukoni Traders. Mandatory Action: Draft Statement of Defence by 2026-10-15.','English','Sent','Administrator','Administrator','Administrator',NULL,NULL,'GMAIL-SMTP-1790079160941',NULL,'2026-09-24 05:39:11'),('msg-2026-0914-001',NULL,'case-001','CV/2026/0042','Kilombero Sugar Co. Ltd v Mara Logistics Ltd',NULL,'Kilombero Sugar Co. Ltd','Hearing Reminder','Email',NULL,'legal@kilomberosugar.co.tz','Hearing Reminder ÔÇö Kilombero Sugar Co. Ltd v Mara Logistics Ltd, CV/2026/0042','Dear Kilombero Sugar Co. Ltd, The matter is scheduled for hearing on 28 September 2026 at 9:00 AM at the High Court of Tanzania (Commercial Division), Dar es Salaam.','English','Sent','Adv. Asha Mrema','Senior Advocate E. M. Kaija','Adv. Asha Mrema',NULL,NULL,'GMAIL-SMTP-MSG-8849201',NULL,'2026-09-24 05:39:11'),('msg-2026-0915-002',NULL,'case-002','PC Civil Appeal No. 69 of 2018','Abdallah Salum Muwinge v Halima Ismail',NULL,'Halima Ismail','Hearing Reminder','Email',NULL,'halima@example.com','Hearing Reminder ÔÇö PC Civil Appeal No. 69 of 2018','Dear Halima Ismail, The matter is scheduled for hearing on 25 September 2026 at 9:00 AM at the High Court of Tanzania, Dar es Salaam District Registry.','English','Sent','Adv. Baraka Juma','Senior Advocate E. M. Kaija','Adv. Baraka Juma',NULL,NULL,'GMAIL-SMTP-MSG-8849202',NULL,'2026-09-24 05:39:11');
/*!40000 ALTER TABLE `communications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deadlines`
--

DROP TABLE IF EXISTS `deadlines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deadlines` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `case_id` varchar(50) DEFAULT NULL,
  `case_number` varchar(100) DEFAULT NULL,
  `case_title` varchar(255) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `deadline_at` timestamp NULL DEFAULT NULL,
  `deadline_date_string` varchar(50) DEFAULT NULL,
  `deadline_time` varchar(50) DEFAULT NULL,
  `court` varchar(150) DEFAULT NULL,
  `registry` varchar(150) DEFAULT NULL,
  `responsible_lawyer_id` varchar(50) DEFAULT NULL,
  `responsible_lawyer_name` varchar(150) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `statutory_reference` varchar(150) DEFAULT NULL,
  `reminder_at` timestamp NULL DEFAULT NULL,
  `supporting_document` varchar(255) DEFAULT NULL,
  `change_reason` varchar(255) DEFAULT NULL,
  `previous_deadline_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_deadline_case` (`case_id`),
  KEY `idx_deadline_lawyer` (`responsible_lawyer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deadlines`
--

LOCK TABLES `deadlines` WRITE;
/*!40000 ALTER TABLE `deadlines` DISABLE KEYS */;
INSERT INTO `deadlines` VALUES ('dln-1790079146457-14d2','Hearing of Chamber Summons for Injunction (RESCHEDULED)','case-101','CV/2026/0142','Commercial Bank vs Kivukoni Traders','Hearing',NULL,'2026-10-06','09:00','High Court Commercial Division, Dar es Salaam - Courtroom 3',NULL,NULL,'Adv. Asha Mrema','Court Order','Order XXXIX Rule 1 CPC',NULL,NULL,'Adjournment on mutual advocate consent',NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('dln-2026-001','Pre-Trial Hearing ÔÇö Kilombero Sugar Co. Ltd v Mara Logistics Ltd','case-001','CV/2026/0042','Kilombero Sugar Co. Ltd v Mara Logistics Ltd','Hearing',NULL,'2026-09-28','09:00','High Court of Tanzania (Commercial Division)',NULL,NULL,'Adv. Asha Mrema','Court Cause List','Commercial Court Rules 2012',NULL,NULL,'Scheduled regular hearing',NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('dln-2026-002','Mention & Hearing ÔÇö Abdallah Salum Muwinge v Halima Ismail','case-002','PC Civil Appeal No. 69 of 2018','Abdallah Salum Muwinge v Halima Ismail','Hearing',NULL,'2026-09-25','09:00','High Court of Tanzania, Dar es Salaam Registry',NULL,NULL,'Adv. Baraka Juma','Court Summons','Law of Marriage Act, Cap 29',NULL,NULL,'Mention before Deputy Registrar',NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11');
/*!40000 ALTER TABLE `deadlines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents` (
  `id` varchar(50) NOT NULL,
  `case_id` varchar(50) DEFAULT NULL,
  `case_number` varchar(100) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `original_filename` varchar(255) NOT NULL,
  `stored_filename` varchar(255) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `storage_path` varchar(500) DEFAULT NULL,
  `sensitivity` varchar(50) DEFAULT 'CONFIDENTIAL',
  `category` varchar(100) DEFAULT NULL,
  `uploaded_by` varchar(50) DEFAULT NULL,
  `uploaded_by_name` varchar(150) DEFAULT NULL,
  `ocr_status` varchar(50) DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_doc_case` (`case_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `generated_documents`
--

DROP TABLE IF EXISTS `generated_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `generated_documents` (
  `id` varchar(50) NOT NULL,
  `case_id` varchar(50) DEFAULT NULL,
  `case_number` varchar(100) DEFAULT NULL,
  `document_type` varchar(100) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_format` varchar(50) DEFAULT 'PDF',
  `generated_by` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `generated_documents`
--

LOCK TABLES `generated_documents` WRITE;
/*!40000 ALTER TABLE `generated_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `generated_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_alerts`
--

DROP TABLE IF EXISTS `security_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `security_alerts` (
  `alert_id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `staff_id` varchar(50) DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `alert_type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `severity` varchar(20) DEFAULT 'HIGH',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved` tinyint(1) DEFAULT 0,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolved_by` varchar(50) DEFAULT NULL,
  `locked_reason` varchar(100) DEFAULT NULL,
  `locked_by` varchar(50) DEFAULT NULL,
  `client_ip` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`alert_id`),
  KEY `idx_sec_alerts_resolved` (`resolved`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_alerts`
--

LOCK TABLES `security_alerts` WRITE;
/*!40000 ALTER TABLE `security_alerts` DISABLE KEYS */;
INSERT INTO `security_alerts` VALUES ('alt-001','usr-005','LAW-0099','Adv. Daudi Mussa','Lawyer','ACCOUNT_LOCKED','Administrative Security Lock','Account placed on administrative security hold pending compliance review.','HIGH','2026-09-24 05:39:11',0,NULL,NULL,NULL,NULL,'197.250.48.12'),('alt-002','usr-007','EMP-1017','Joseph Moss','Legal Clerk','TEMPORARY_LOCK','Temporary Login Lock','Three unsuccessful login attempts','HIGH','2026-09-24 05:39:11',0,NULL,NULL,NULL,NULL,'127.0.0.1');
/*!40000 ALTER TABLE `security_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_events`
--

DROP TABLE IF EXISTS `security_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `security_events` (
  `id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `user_name` varchar(150) DEFAULT NULL,
  `event_type` varchar(100) NOT NULL,
  `result` varchar(200) DEFAULT NULL,
  `event_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `description` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `resolved` tinyint(1) DEFAULT 0,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolved_by` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sec_events_user` (`user_id`),
  KEY `idx_sec_events_type` (`event_type`),
  KEY `idx_sec_events_time` (`event_time`),
  KEY `idx_sec_events_resolved` (`resolved`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_events`
--

LOCK TABLES `security_events` WRITE;
/*!40000 ALTER TABLE `security_events` DISABLE KEYS */;
INSERT INTO `security_events` VALUES ('evt-1790079160976-42c3d','usr-001',NULL,'Client Communication',NULL,'2026-09-24 05:39:11','Email sent to asha.mrema@slcms-law.com regarding CV/2026/0142 ([SLCMS Docket Alert] Action Required: Draft Statement of Defence (CV/2026/0142))','127.0.0.1',0,NULL,NULL),('evt-1790179478927-htuqg','usr-001',NULL,'Login Succeeded',NULL,'2026-09-24 05:39:11','Staff member SLCMS System Administrator (ADM-0001) authenticated via secure TLS 1.3 session','192.168.1.104 (Dar es Salaam Chambers)',0,NULL,NULL),('evt-20260919-083000-h7','usr-001',NULL,'SOC-2 Ledger Verification',NULL,'2026-09-24 05:39:11','Tamper-evident SOC-2 cryptographic chain verified; 0 discrepancies found','127.0.0.1 (Local Console)',0,NULL,NULL),('evt-20260919-094020-g6','unknown',NULL,'Login Failed',NULL,'2026-09-24 05:39:11','Unknown username \'root\' attempted authentication via public web interface','41.59.88.22 (Tanzania Telecom)',0,NULL,NULL),('evt-20260919-110500-f5','usr-002',NULL,'Fee Retainer Logged',NULL,'2026-09-24 05:39:11','Retainer deposit confirmed for AuraBio Patent Infringement matter ($8,500.00)','192.168.1.104 (Dar es Salaam Chambers)',0,NULL,NULL),('evt-20260919-142010-e4','usr-004',NULL,'Court Appearance Logged',NULL,'2026-09-24 05:39:11','High Court Land Division preliminary mention before Deputy Registrar recorded','192.168.1.112 (Registry Workstation)',0,NULL,NULL),('evt-20260919-163540-d3','usr-006',NULL,'Matter Registered',NULL,'2026-09-24 05:39:11','Commercial dispute registered: Kilimanjaro Agro-Industries Ltd vs. Coastal Hauliers & Logistics Ltd','192.168.1.115 (Associate Chambers)',0,NULL,NULL),('evt-20260920-101000-c2','usr-001',NULL,'Configuration Updated',NULL,'2026-09-24 05:39:11','Gmail SMTP TLS relay configuration verified and test handshake passed','127.0.0.1 (Local Console)',0,NULL,NULL),('evt-20260920-115015-b1','usr-003',NULL,'Case Status Transition',NULL,'2026-09-24 05:39:11','Matter status transitioned from Pleadings Closed to Pre-Trial Conference','192.168.1.108 (Dar es Salaam Chambers)',0,NULL,NULL),('evt-20260920-142500-a9','usr-002',NULL,'Digital Signature Applied',NULL,'2026-09-24 05:39:11','Advocate digital seal applied to Petition of Appeal in Commercial Dispute TZHC 4102/2026','192.168.1.104 (Dar es Salaam Chambers)',0,NULL,NULL),('evt-20260920-151030-z8','usr-004',NULL,'SMS Notification Dispatched',NULL,'2026-09-24 05:39:11','Pre-Trial hearing SMS reminder dispatched to Dr. Clara Thorne for Wednesday 9:00 AM','192.168.1.112 (Registry Workstation)',0,NULL,NULL),('evt-20260920-164000-y7','usr-001',NULL,'BACKUP_CREATED',NULL,'2026-09-24 05:39:11','Weekly encrypted archive generated and replicated to off-site vault (24.1 KB)','127.0.0.1 (Local Console)',0,NULL,NULL),('evt-20260921-084845-x6','usr-007',NULL,'Login Failed',NULL,'2026-09-24 05:39:11','Unsuccessful login attempt (1 of 3) ÔÇö PIN verification error','192.168.1.110 (Court Registry Desk)',0,NULL,NULL),('evt-20260921-084920-w5','usr-007',NULL,'Login Failed',NULL,'2026-09-24 05:39:11','Unsuccessful login attempt (2 of 3) ÔÇö PIN verification error','192.168.1.110 (Court Registry Desk)',0,NULL,NULL),('evt-20260921-084950-v4','usr-007',NULL,'Login Failed',NULL,'2026-09-24 05:39:11','Unsuccessful login attempt (3 of 3) ÔÇö PIN verification error','192.168.1.110 (Court Registry Desk)',0,NULL,NULL),('evt-20260921-085010-u3','usr-007',NULL,'Account Temporarily Locked',NULL,'2026-09-24 05:39:11','Account temporarily locked for 2 minutes after 3 failed login attempts (incorrect security PIN)','192.168.1.110 (Court Registry Desk)',0,NULL,NULL),('evt-20260921-091520-t2','usr-001',NULL,'Account Unlocked',NULL,'2026-09-24 05:39:11','Account unlocked by administrator after manual identity verification','127.0.0.1 (Local Console)',0,NULL,NULL),('evt-20260921-103000-s1','usr-003',NULL,'Client Registered',NULL,'2026-09-24 05:39:11','Serengeti Breweries Ltd (Corporate Advisory) registered in client database by Adv. Baraka Juma','192.168.1.108 (Dar es Salaam Chambers)',0,NULL,NULL),('evt-20260921-114510-r9','usr-002',NULL,'Case Assigned',NULL,'2026-09-24 05:39:11','Matter Catherine Edwin Mbele v Godfrey Abednego Mushi assigned to Adv. Baraka Juma as Lead','192.168.1.104 (Dar es Salaam Chambers)',0,NULL,NULL),('evt-20260921-132040-q8','usr-007',NULL,'OCR Text Extracted',NULL,'2026-09-24 05:39:11','Commercial Contract Annexure A-D processed with Tesseract OCR; text integrity verified','192.168.1.110 (Court Registry Desk)',0,NULL,NULL),('evt-20260921-145000-p7','usr-001',NULL,'Temporary Password Issued',NULL,'2026-09-24 05:39:11','One-time security credentials generated for Adv. Daudi Mussa (TLS Advocate Roll LAW-0099)','127.0.0.1 (Local Console)',0,NULL,NULL),('evt-20260921-145530-o6','usr-005',NULL,'Account Manually Locked',NULL,'2026-09-24 05:39:11','Account manually locked by administrator pending annual practising certificate renewal','127.0.0.1 (Local Console)',0,NULL,NULL),('evt-20260921-154010-n5','usr-004',NULL,'Cause List Synchronized',NULL,'2026-09-24 05:39:11','High Court of Tanzania Main Registry weekly cause list synchronized into calendar','192.168.1.112 (Registry Workstation)',0,NULL,NULL),('evt-20260921-163020-m4','usr-003',NULL,'Invoice Approved',NULL,'2026-09-24 05:39:11','Invoice INV-2026-089 approved for CRDB Bank PLC ($12,450.00 corporate retainer)','192.168.1.108 (Dar es Salaam Chambers)',0,NULL,NULL),('evt-20260921-171500-l3','usr-002',NULL,'Formal Case Closure',NULL,'2026-09-24 05:39:11','Final Settlement Decree executed for Vanguard vs. Apex Holdings; matter archived','192.168.1.104 (Dar es Salaam Chambers)',0,NULL,NULL),('evt-20260922-080512-k2','usr-007',NULL,'Login Succeeded',NULL,'2026-09-24 05:39:11','Registry desktop terminal logged in successfully','192.168.1.110 (Court Registry Desk)',0,NULL,NULL),('evt-20260922-083000-j1','usr-002',NULL,'Login Succeeded',NULL,'2026-09-24 05:39:11','Managing partner session initialized; cryptographic token valid','192.168.1.104 (Dar es Salaam Chambers)',0,NULL,NULL),('evt-20260922-091530-i9','usr-003',NULL,'Login Succeeded',NULL,'2026-09-24 05:39:11','Two-factor authentication verified via authenticator token; session TLS 1.3','192.168.1.108 (Dar es Salaam Chambers)',0,NULL,NULL),('evt-20260922-094000-h8','usr-006',NULL,'Pleading Submitted',NULL,'2026-09-24 05:39:11','Chamber Summons and Supporting Affidavit for Injunction submitted (Matter TZHC/COMM/2026/089)','192.168.1.115 (Associate Chambers)',0,NULL,NULL),('evt-20260922-102015-g7','usr-001',NULL,'Duties Separation Review',NULL,'2026-09-24 05:39:11','Quarterly RBAC & ethical Chinese wall separation review verified for active litigation matters','127.0.0.1 (Local Console)',0,NULL,NULL),('evt-20260922-110500-f6','usr-002',NULL,'Client Advisory Dispatched',NULL,'2026-09-24 05:39:11','Formal litigation risk assessment dispatched to Serengeti Breweries Legal Directorate','192.168.1.104 (Dar es Salaam Chambers)',0,NULL,NULL),('evt-20260922-113510-e5','unknown',NULL,'Login Failed',NULL,'2026-09-24 05:39:11','Unauthorized login attempt from external IP (197.250.84.119); blocked by sentinel','197.250.84.119 (External ISP)',0,NULL,NULL),('evt-20260922-121020-d4','usr-003',NULL,'Court Attendance Recorded',NULL,'2026-09-24 05:39:11','Pre-trial scheduling conference before Justice Mwambegele (Commercial Case No. 102)','192.168.1.108 (High Court Mobile Terminal)',0,NULL,NULL),('evt-20260922-124500-c3','usr-004',NULL,'Document Uploaded',NULL,'2026-09-24 05:39:11','Expert Witness Forensic Accounting Report (v2.1) uploaded with SHA-256 seal','192.168.1.112 (Registry Workstation)',0,NULL,NULL),('evt-20260922-133045-b2','usr-001',NULL,'BACKUP_CREATED',NULL,'2026-09-24 05:39:11','System database snapshot created & AES-256 encrypted (24.8 KB)','127.0.0.1 (Local Console)',0,NULL,NULL),('evt-20260922-135812-a1','usr-002',NULL,'Pleading Filed',NULL,'2026-09-24 05:39:11','Written Statement of Defence filed in High Court Commercial Div (TZHC/COMM/2026/089)','192.168.1.104 (Dar es Salaam Chambers)',0,NULL,NULL);
/*!40000 ALTER TABLE `security_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_backups`
--

DROP TABLE IF EXISTS `system_backups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_backups` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `filepath` varchar(500) NOT NULL,
  `size_bytes` bigint(20) NOT NULL,
  `status` varchar(30) NOT NULL,
  `created_by` varchar(150) DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_backups`
--

LOCK TABLES `system_backups` WRITE;
/*!40000 ALTER TABLE `system_backups` DISABLE KEYS */;
INSERT INTO `system_backups` VALUES (1,'slcm_db_complete_backup.sql','data/backups/slcm_db_complete_backup.sql',45000,'VERIFIED','SLCMS Administrator',1,'2026-09-24 05:39:11'),(2,'slcms_full_database_dump.sql','data/backups/slcms_full_database_dump.sql',36988,'VERIFIED','SLCMS Administrator',1,'2026-09-24 05:39:11'),(3,'SLCMS_Full_Database_Backup_Latest.json','data/backups/SLCMS_Full_Database_Backup_Latest.json',130842,'VERIFIED','SLCMS Administrator',1,'2026-09-24 05:39:11'),(4,'slcm_db_complete_backup.sql','data/backups/slcm_db_complete_backup.sql',45000,'VERIFIED','SLCMS Administrator',1,'2026-09-24 05:40:44'),(5,'slcms_full_database_dump.sql','data/backups/slcms_full_database_dump.sql',36988,'VERIFIED','SLCMS Administrator',1,'2026-09-24 05:40:44'),(6,'SLCMS_Full_Database_Backup_Latest.json','data/backups/SLCMS_Full_Database_Backup_Latest.json',130842,'VERIFIED','SLCMS Administrator',1,'2026-09-24 05:40:44');
/*!40000 ALTER TABLE `system_backups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_setting_audit`
--

DROP TABLE IF EXISTS `system_setting_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_setting_audit` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(50) DEFAULT NULL,
  `admin_name` varchar(150) DEFAULT NULL,
  `setting_key` varchar(100) NOT NULL,
  `previous_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `action_status` varchar(30) DEFAULT 'SUCCESS',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_setting_audit`
--

LOCK TABLES `system_setting_audit` WRITE;
/*!40000 ALTER TABLE `system_setting_audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_setting_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_settings` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` varchar(30) NOT NULL,
  `updated_by` bigint(20) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'organization_name','SLCMS Law Firm','TEXT',1,'2026-09-24 05:39:11'),(2,'system_name','Smart Legal Case Management System','TEXT',1,'2026-09-24 05:39:11'),(3,'system_short_name','SLCMS','TEXT',1,'2026-09-24 05:39:11'),(4,'organization_logo','assets/SLCMS.png','TEXT',1,'2026-09-24 05:39:11'),(5,'official_email','admin@slcms.local','EMAIL',1,'2026-09-24 05:39:11'),(6,'phone_number','+255700000001','PHONE',1,'2026-09-24 05:39:11'),(7,'office_address','Dar es Salaam, Tanzania','TEXT',1,'2026-09-24 05:39:11'),(8,'minimum_password_length','10','NUMBER',1,'2026-09-24 05:39:11'),(9,'maximum_login_attempts','5','NUMBER',1,'2026-09-24 05:39:11'),(10,'lock_duration_minutes','15','NUMBER',1,'2026-09-24 05:39:11'),(11,'session_duration_minutes','60','NUMBER',1,'2026-09-24 05:39:11'),(12,'maximum_upload_mb','50','NUMBER',1,'2026-09-24 05:39:11'),(13,'ocr_enabled','true','BOOLEAN',1,'2026-09-24 05:39:11'),(14,'automatic_backup','WEEKLY','ENUM',1,'2026-09-24 05:39:11'),(15,'allowed_file_types','PDF,DOCX,JPG,PNG','TEXT',1,'2026-09-24 05:39:11'),(16,'case_number_format','CV/YYYY/####','TEXT',1,'2026-09-24 05:39:11'),(17,'case_categories','Civil,Criminal,Land,Matrimonial,Probate,Commercial,Other','TEXT',1,'2026-09-24 05:39:11'),(18,'case_statuses','Active,Pending,Closed,Archived','TEXT',1,'2026-09-24 05:39:11');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tasks` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `case_id` varchar(50) DEFAULT NULL,
  `case_number` varchar(100) DEFAULT NULL,
  `case_title` varchar(255) DEFAULT NULL,
  `assigned_to` varchar(50) DEFAULT NULL,
  `assigned_to_name` varchar(150) DEFAULT NULL,
  `assigned_to_avatar` varchar(50) DEFAULT NULL,
  `supervisor_id` varchar(50) DEFAULT NULL,
  `supervisor_name` varchar(150) DEFAULT NULL,
  `priority` varchar(50) DEFAULT 'MEDIUM',
  `status` varchar(50) DEFAULT 'PENDING',
  `due_at` timestamp NULL DEFAULT NULL,
  `due_date_string` varchar(50) DEFAULT NULL,
  `due_date` varchar(50) DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `reminder_at` timestamp NULL DEFAULT NULL,
  `is_statutory_deadline` tinyint(1) DEFAULT 0,
  `statutory_reference` varchar(150) DEFAULT NULL,
  `filing_status` varchar(50) DEFAULT NULL,
  `filing_date` varchar(50) DEFAULT NULL,
  `filing_reference` varchar(150) DEFAULT NULL,
  `review_feedback` text DEFAULT NULL,
  `is_administrative` tinyint(1) DEFAULT 0,
  `cancellation_reason` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_by_name` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_task_case` (`case_id`),
  KEY `idx_task_assigned` (`assigned_to`),
  KEY `idx_task_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES ('tsk-1790079146327-eb6b','Draft Statement of Defence (AMENDED) - Suit No. 142','case-101','CV/2026/0142','Commercial Bank vs Kivukoni Traders','usr-002','Adv. Asha Mrema',NULL,NULL,NULL,'Urgent','todo',NULL,'2026-10-15','2026-10-15','Modified by Administrator with statutory limitation extension.',NULL,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11',NULL),('tsk-2026-001','Prepare Chamber Summons & Supporting Affidavit','case-101','CV/2026/0142','Commercial Bank vs Kivukoni Traders','usr-002','Adv. Asha Mrema',NULL,NULL,NULL,'HIGH','IN_PROGRESS',NULL,'2026-10-02','2026-10-02','Urgent injunctive application under Order XXXIX Rule 1 CPC.',NULL,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11',NULL),('tsk-2026-002','Synchronize Cause List with Court of Appeal','CASE-2025-001','Criminal Appeal No. 30 of 2021','Deogratius Peter Shayo v. Republic','usr-004','Emmanuel Kilonzo',NULL,NULL,NULL,'MEDIUM','COMPLETED',NULL,'2026-09-21','2026-09-21','Inspect physical roll and file index in appellate registry.',NULL,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11',NULL);
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `staff_id` varchar(50) NOT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `role_title` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'ACTIVE',
  `account_status` varchar(50) NOT NULL DEFAULT 'ACTIVE',
  `failed_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` bigint(20) DEFAULT NULL,
  `admin_locked` tinyint(1) NOT NULL DEFAULT 0,
  `last_successful_login` timestamp NULL DEFAULT NULL,
  `last_failed_login` timestamp NULL DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT 0,
  `department` varchar(100) DEFAULT NULL,
  `bar_number` varchar(50) DEFAULT NULL,
  `advocate_number` varchar(50) DEFAULT NULL,
  `practising_cert_no` varchar(50) DEFAULT NULL,
  `national_id_ref` varchar(50) DEFAULT NULL,
  `identity_verification_status` varchar(50) DEFAULT NULL,
  `invitation_id` varchar(50) DEFAULT NULL,
  `approved_by` varchar(50) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `avatar_img` varchar(500) DEFAULT NULL,
  `first_login_required` tinyint(1) DEFAULT 0,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_id` (`staff_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('usr-001','ADM-0001','ADM-0001','slcms.admin','SLCMS System Administrator','admin@slcms.local','+255 700 000 001','.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m','Administrator','System Administrator','ACTIVE','ACTIVE',0,NULL,0,NULL,NULL,0,'System Governance & Administration',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('usr-002','LAW-0021','LAW-0021','asha.mrema','Adv. Asha Mrema','asha.mrema@slcms.local','+255 754 112 233','.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m','Senior Lawyer','Senior Advocate','ACTIVE','ACTIVE',0,NULL,0,NULL,NULL,0,'Litigation & Dispute Resolution',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('usr-003','LAW-0035','LAW-0035','baraka.juma','Adv. Baraka Juma','baraka.juma@slcms.local','+255 713 445 566','.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m','Lawyer','Advocate','ACTIVE','ACTIVE',0,NULL,0,NULL,NULL,0,'Corporate & Commercial Law',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('usr-004','CLK-0008','CLK-0008','emmanuel.kilonzo','Emmanuel Kilonzo','emmanuel.kilonzo@slcms.local','+255 784 778 899','.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m','Legal Clerk','Court Filing Clerk','ACTIVE','ACTIVE',0,NULL,0,NULL,NULL,0,'Court Registry & Documentation',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('usr-005','LAW-0099','LAW-0099','daudi.mussa','Adv. Daudi Mussa','daudi.mussa@slcms.local','+255 765 999 888','.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m','Lawyer','Advocate','ACTIVE','LOCKED',0,NULL,1,NULL,NULL,0,'Litigation',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('usr-006','LAW-0081','LAW-0081','jmoses','Jack moses','jmoses@slcms-law.co.tz','+255 754 000 111','.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m','Lawyer','Litigation Associate','ACTIVE','ACTIVE',0,NULL,0,NULL,NULL,0,'Commercial Litigation',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11'),('usr-007','EMP-1017','EMP-1017','jmoss','Joseph Moss','jmoss@slcms-law.co.tz','+255 754 000 786','.9U2yF5P1Qo1aQdC8OaezWJ2H6gU2Z2k4aXq8eKkL8F8aM6m','Legal Clerk','Court Registry Clerk','ACTIVE','TEMPORARILY_LOCKED',3,253402300799000,0,NULL,NULL,0,'Court Registry & Documentation',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,'2026-09-24 05:39:11','2026-09-24 05:39:11');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-24  8:41:09
