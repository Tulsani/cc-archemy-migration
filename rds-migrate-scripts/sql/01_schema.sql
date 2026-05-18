-- MySQL dump 10.13  Distrib 5.7.12, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: archemy
-- ------------------------------------------------------
-- Server version	5.7.13-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `areas`
--

DROP TABLE IF EXISTS `areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `areas` (
  `AREA_ID` int(11) NOT NULL AUTO_INCREMENT,
  `AREA_PARENT_ID` int(11) DEFAULT NULL,
  `AREA_ORDER_NO` varchar(45) DEFAULT NULL,
  `AREA_DEPTH_LEVEL` int(11) DEFAULT NULL,
  `DIMENSION_ID` int(11) DEFAULT NULL,
  `AREA_NAME` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`AREA_ID`),
  KEY `DIMENSION_FK_idx` (`DIMENSION_ID`),
  KEY `AREA_ID_AREA_PARENT_FK_idx` (`AREA_PARENT_ID`),
  CONSTRAINT `AREA_DIMENSION_ID_FK` FOREIGN KEY (`DIMENSION_ID`) REFERENCES `dimensions` (`DIMENSION_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AREA_ID_AREA_PARENT_FK` FOREIGN KEY (`AREA_PARENT_ID`) REFERENCES `areas` (`AREA_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32110 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `cells`
--

DROP TABLE IF EXISTS `cells`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cells` (
  `CELL_ID` int(11) NOT NULL AUTO_INCREMENT,
  `AREA_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`CELL_ID`),
  KEY `CELL_AREA_ID_FK_idx` (`AREA_ID`),
  CONSTRAINT `CELL_AREA_ID_FK` FOREIGN KEY (`AREA_ID`) REFERENCES `areas` (`AREA_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `customer_info`
--

DROP TABLE IF EXISTS `customer_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_info` (
  `CUSTOMER_NAME` varchar(150) DEFAULT NULL,
  `INDUSTRY` varchar(150) DEFAULT NULL,
  `USER_ID` varchar(150) NOT NULL,
  PRIMARY KEY (`USER_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `dajoin`
--

DROP TABLE IF EXISTS `dajoin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dajoin` (
  `dimension_name` varchar(45) DEFAULT NULL,
  `dimension_id` int(11) NOT NULL DEFAULT '0',
  `area_name` varchar(100) DEFAULT NULL,
  `area_id` int(11) NOT NULL DEFAULT '0',
  `AREA_PARENT_ID` int(11) DEFAULT NULL,
  `area_depth_level` int(11) DEFAULT NULL,
  `area_order_no` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `dimensions`
--

DROP TABLE IF EXISTS `dimensions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dimensions` (
  `DIMENSION_ID` int(11) NOT NULL AUTO_INCREMENT,
  `DIMENSION_NAME` varchar(45) DEFAULT NULL,
  `DOMAIN_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`DIMENSION_ID`),
  UNIQUE KEY `DIMENSIONS_NAME_UQ_idx` (`DIMENSION_NAME`,`DOMAIN_ID`),
  KEY `DOMAIN_ID_FK_idx` (`DOMAIN_ID`),
  CONSTRAINT `DIMENSION_DOMAIN_ID_FK` FOREIGN KEY (`DOMAIN_ID`) REFERENCES `domains` (`DOMAIN_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `domains`
--

DROP TABLE IF EXISTS `domains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `domains` (
  `DOMAIN_ID` int(11) NOT NULL AUTO_INCREMENT,
  `DOMAIN_NAME` varchar(45) NOT NULL COMMENT 'Contains Domain Description',
  `DOMAIN_DESCRIPTION` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`DOMAIN_ID`),
  UNIQUE KEY `DOMAIN_NAME_UNIQUE` (`DOMAIN_NAME`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `iad_relationships`
--

DROP TABLE IF EXISTS `iad_relationships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `iad_relationships` (
  `FROM_IAD_TO_CELL_ASSIGNMENT_ID` int(11) NOT NULL,
  `TO_IAD_TO_CELL_ASSIGNMENT_ID` int(11) NOT NULL,
  `RELATIONSHIP_TYPE_ID` int(11) NOT NULL,
  `IAD_RELATIONSHIP_ID` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`IAD_RELATIONSHIP_ID`),
  KEY `IAD_CELL_ASSGN_IAD_ID_idx` (`FROM_IAD_TO_CELL_ASSIGNMENT_ID`),
  KEY `IAD_CELL_ASSGN_CELL_ID_idx` (`TO_IAD_TO_CELL_ASSIGNMENT_ID`),
  KEY `IAD_RLTN_RELATION_ID_FK_idx` (`RELATIONSHIP_TYPE_ID`),
  CONSTRAINT `IAD_RLTN_FROM_IAD_CELL_ASSIGNMENT_FK` FOREIGN KEY (`FROM_IAD_TO_CELL_ASSIGNMENT_ID`) REFERENCES `iad_to_cell_assignments` (`IAD_CELL_ASSIGNMENT_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `IAD_RLTN_TO_IAD_CELL_ASSIGNMENT_FK` FOREIGN KEY (`TO_IAD_TO_CELL_ASSIGNMENT_ID`) REFERENCES `iad_to_cell_assignments` (`IAD_CELL_ASSIGNMENT_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `IAD_RLTN_RELATION_ID_FK` FOREIGN KEY (`RELATIONSHIP_TYPE_ID`) REFERENCES `relationship_types` (`RELATIONSHIP_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `iad_to_cell_assignments`
--

DROP TABLE IF EXISTS `iad_to_cell_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `iad_to_cell_assignments` (
  `IAD_CELL_ASSIGNMENT_ID` int(11) NOT NULL AUTO_INCREMENT,
  `IAD_ID` int(11) DEFAULT NULL,
  `CELL_ID` int(11) DEFAULT NULL,
  `AREA_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`IAD_CELL_ASSIGNMENT_ID`),
  KEY `CELL_ASSGN_IAD_ID_FK_idx` (`IAD_ID`),
  KEY `CELL_ASSGN_CELL_ID_FK_idx` (`CELL_ID`),
  CONSTRAINT `CELL_ASSGN_CELL_ID_FK` FOREIGN KEY (`CELL_ID`) REFERENCES `cells` (`CELL_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CELL_ASSGN_IAD_ID_FK` FOREIGN KEY (`IAD_ID`) REFERENCES `iads` (`IAD_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `iad_to_node_assignments`
--

DROP TABLE IF EXISTS `iad_to_node_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `iad_to_node_assignments` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `IAD_NODE_ASSIGN_NODE_ID` int(11) DEFAULT NULL,
  `IAD_NODE_ASSIGN_IAD_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `NODE_ASSGN_TO_IAD_ID_idx` (`IAD_NODE_ASSIGN_IAD_ID`),
  KEY `NODE_ASSGN_TO_NODE_ID_idx` (`IAD_NODE_ASSIGN_NODE_ID`),
  CONSTRAINT `NODE_ASSGN_TO_IAD_ID` FOREIGN KEY (`IAD_NODE_ASSIGN_IAD_ID`) REFERENCES `iads` (`IAD_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `NODE_ASSGN_TO_NODE_ID` FOREIGN KEY (`IAD_NODE_ASSIGN_NODE_ID`) REFERENCES `nodes` (`NODE_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `iads`
--

DROP TABLE IF EXISTS `iads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `iads` (
  `IAD_ID` int(11) NOT NULL AUTO_INCREMENT,
  `IAD_NAME` varchar(100) DEFAULT NULL,
  `IAD_TYPE` varchar(100) NOT NULL,
  `DOMAIN_ID` int(11) DEFAULT NULL,
  `KAD_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`IAD_ID`),
  UNIQUE KEY `IAD_NAME_UNIQUE` (`IAD_NAME`,`DOMAIN_ID`,`KAD_ID`),
  KEY `KAD_DOMAIN_ID_FK_idx` (`DOMAIN_ID`),
  KEY `IAD_KAD_ID_FK_idx` (`KAD_ID`),
  CONSTRAINT `IAD_DOMAIN_ID_FK` FOREIGN KEY (`DOMAIN_ID`) REFERENCES `domains` (`DOMAIN_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `IAD_KAD_ID_FK` FOREIGN KEY (`KAD_ID`) REFERENCES `kads` (`KAD_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `kad_dimensions_area`
--

DROP TABLE IF EXISTS `kad_dimensions_area`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kad_dimensions_area` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `DIMENSION_ID` int(11) NOT NULL,
  `KAD_ID` int(11) NOT NULL,
  `AREA_ID` int(11) DEFAULT NULL,
  `AREA_PARENT_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `KAD_UNQ_IDX` (`DIMENSION_ID`,`KAD_ID`,`AREA_ID`,`AREA_PARENT_ID`),
  KEY `KAD_DIMENSION_ID_FK_idx` (`DIMENSION_ID`),
  KEY `KAD_DIMENSIONS_KAD_ID_FK_idx` (`KAD_ID`),
  KEY `KAD_DIM_AREA_idx` (`AREA_ID`),
  CONSTRAINT `KAD_DIM_AREA` FOREIGN KEY (`AREA_ID`) REFERENCES `areas` (`AREA_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `KAD_DIM_ID_FK` FOREIGN KEY (`DIMENSION_ID`) REFERENCES `dimensions` (`DIMENSION_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `KAD_DIM_KAD_ID_FK` FOREIGN KEY (`KAD_ID`) REFERENCES `kads` (`KAD_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `kad_registration`
--

DROP TABLE IF EXISTS `kad_registration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kad_registration` (
  `USER_ID` varchar(150) NOT NULL,
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `KAD_ID` int(11) NOT NULL,
  `MATURITY_RATING` int(11) NOT NULL,
  `DEPLOYMENT_STATUS` varchar(100) NOT NULL,
  `APPLICABILITY_EXTENT` varchar(100) NOT NULL,
  `BENEFIT_RATING` int(11) NOT NULL,
  `COMMENTS` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `KAD_REGISTER_UK_IDX` (`USER_ID`,`KAD_ID`),
  KEY `KAD_REGISTER_TO_KAD_FK_idx` (`KAD_ID`),
  CONSTRAINT `KAD_REGISTER_TO_KAD_FK` FOREIGN KEY (`KAD_ID`) REFERENCES `kads` (`KAD_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `kad_to_node_assignment`
--

DROP TABLE IF EXISTS `kad_to_node_assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kad_to_node_assignment` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `KAD_ID` int(11) DEFAULT NULL,
  `NODE_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `KAD_NODE_ASGN_KAD_FK_idx` (`KAD_ID`),
  KEY `KAD_NODE_ASGN_NODE_ID_FK_idx` (`NODE_ID`),
  CONSTRAINT `KAD_NODE_ASGN_KAD_FK` FOREIGN KEY (`KAD_ID`) REFERENCES `kads` (`KAD_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `KAD_NODE_ASGN_NODE_ID_FK` FOREIGN KEY (`NODE_ID`) REFERENCES `nodes` (`NODE_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `kads`
--

DROP TABLE IF EXISTS `kads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kads` (
  `KAD_ID` int(11) NOT NULL AUTO_INCREMENT,
  `KAD_NAME` varchar(100) DEFAULT NULL,
  `DOMAIN_ID` int(11) DEFAULT NULL,
  `KAD_LINK` varchar(300) DEFAULT NULL,
  `KAD_LINK_PUBLIC` varchar(300) DEFAULT NULL,
  `KAD_HIT_COUNTER` int(11) DEFAULT '0',
  `RECURRING_BUS_PROBLEM_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`KAD_ID`),
  UNIQUE KEY `KAD_NAME_UNIQUE` (`KAD_NAME`),
  KEY `DOMAIN_ID_KAD_FK_idx` (`DOMAIN_ID`),
  KEY `KAD_RECURRING_BUS_FK_idx` (`RECURRING_BUS_PROBLEM_ID`),
  CONSTRAINT `KAD_DOMAIN_ID_FK` FOREIGN KEY (`DOMAIN_ID`) REFERENCES `domains` (`DOMAIN_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `KAD_RECURRING_BUS_FK` FOREIGN KEY (`RECURRING_BUS_PROBLEM_ID`) REFERENCES `recurring_bus_problem` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `node_relationships`
--

DROP TABLE IF EXISTS `node_relationships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `node_relationships` (
  `FROM_NODE_ID` int(11) DEFAULT NULL,
  `TO_NODE_ID` int(11) DEFAULT NULL,
  `NODE_RELATIONSHIPS_ID` int(11) NOT NULL AUTO_INCREMENT,
  `RELATIONSHIP_TYPE_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`NODE_RELATIONSHIPS_ID`),
  KEY `NODE_RLTN_NODE_NODE_ID_FK_idx` (`FROM_NODE_ID`),
  KEY `NODE_RLTN_NODE_ID_FK_2_idx` (`TO_NODE_ID`),
  KEY `NODE_RLTN_RLTN_TYPE_ID_idx` (`RELATIONSHIP_TYPE_ID`),
  CONSTRAINT `NODE_RLTN_NODE_ID_FK` FOREIGN KEY (`FROM_NODE_ID`) REFERENCES `nodes` (`NODE_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `NODE_RLTN_NODE_ID_FK_2` FOREIGN KEY (`TO_NODE_ID`) REFERENCES `nodes` (`NODE_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `NODE_RLTN_RLTN_TYPE_ID` FOREIGN KEY (`RELATIONSHIP_TYPE_ID`) REFERENCES `relationship_types` (`RELATIONSHIP_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `nodes`
--

DROP TABLE IF EXISTS `nodes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nodes` (
  `NODE_ID` int(11) NOT NULL AUTO_INCREMENT,
  `NODE_NAME` varchar(100) NOT NULL,
  `ORGANIZATION_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`NODE_ID`),
  KEY `NODE_TO_ORGANIZATION_ID_idx` (`ORGANIZATION_ID`),
  CONSTRAINT `NODE_TO_ORGANIZATION_ID` FOREIGN KEY (`ORGANIZATION_ID`) REFERENCES `organizations` (`ORGANIZATION_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `organization_types`
--

DROP TABLE IF EXISTS `organization_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_types` (
  `ORGANIZATION_TYPE_ID` int(11) NOT NULL AUTO_INCREMENT,
  `ORGANIZATION_TYPE_NAME` varchar(150) DEFAULT NULL,
  `ORGANIZATION_TYPE_DESCRIPTION` varchar(300) DEFAULT NULL,
  `DOMAIN_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`ORGANIZATION_TYPE_ID`),
  UNIQUE KEY `ORGANIZATION_TYPE_NAME_UNIQUE` (`ORGANIZATION_TYPE_NAME`,`DOMAIN_ID`),
  KEY `ORG_TYPE_TO_DOMAIN_ID_FK_idx` (`DOMAIN_ID`),
  CONSTRAINT `ORG_TYPE_TO_DOMAIN_ID_FK` FOREIGN KEY (`DOMAIN_ID`) REFERENCES `domains` (`DOMAIN_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organizations` (
  `ORGANIZATION_ID` int(11) NOT NULL AUTO_INCREMENT,
  `ORGANIZATION_NAME` varchar(100) DEFAULT NULL,
  `DOMAIN_ID` int(11) DEFAULT NULL,
  `ORGANIZATION_TYPE_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`ORGANIZATION_ID`),
  UNIQUE KEY `ORGANIZATION_NAME_UNIQUE` (`ORGANIZATION_NAME`,`DOMAIN_ID`),
  KEY `ORGANIZATION_TO_DOMAIN_ID_FK_idx` (`DOMAIN_ID`),
  KEY `ORGANIZATIONS_TO_ORG_TYPE_idx` (`ORGANIZATION_TYPE_ID`),
  CONSTRAINT `ORGANIZATIONS_TO_ORG_TYPE` FOREIGN KEY (`ORGANIZATION_TYPE_ID`) REFERENCES `organization_types` (`ORGANIZATION_TYPE_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ORGANIZATION_TO_DOMAIN_ID_FK` FOREIGN KEY (`DOMAIN_ID`) REFERENCES `domains` (`DOMAIN_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--

--
-- Table structure for table `recurring_bus_problem`
--

DROP TABLE IF EXISTS `recurring_bus_problem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recurring_bus_problem` (
  `BUSINESS_PROBLEM` varchar(500) NOT NULL,
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `CONTEXT` varchar(80) DEFAULT NULL,
  `TYPE` varchar(80) DEFAULT NULL,
  `DESCRIPTION` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `relationship_types`
--

DROP TABLE IF EXISTS `relationship_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `relationship_types` (
  `RELATIONSHIP_ID` int(11) NOT NULL AUTO_INCREMENT,
  `RELATIONSHIP_TYPE_NAME` varchar(100) DEFAULT NULL,
  `RELATIONSHIP_TYPE_DESC` varchar(300) DEFAULT NULL,
  `DOMAIN_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`RELATIONSHIP_ID`),
  UNIQUE KEY `RELATIONSHIP_TYPE_NAME_UNIQUE` (`RELATIONSHIP_TYPE_NAME`,`DOMAIN_ID`),
  KEY `RELATIONSHIP_TO_DOMAIN_ID_FK_idx` (`DOMAIN_ID`),
  CONSTRAINT `RELATIONSHIP_TO_DOMAIN_ID_FK` FOREIGN KEY (`DOMAIN_ID`) REFERENCES `domains` (`DOMAIN_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
