/*
 Navicat Premium Data Transfer

 Source Server         : dutbit
 Source Server Type    : MySQL
 Source Server Version : 80023
 Source Host           : localhost:3306
 Source Schema         : anime

 Target Server Type    : MySQL
 Target Server Version : 80023
 File Encoding         : 65001

 Date: 16/01/2022 16:16:31
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for ass_dialogue
-- ----------------------------
DROP TABLE IF EXISTS `ass_dialogue`;
CREATE TABLE `ass_dialogue`  (
  `primary_key` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `start_hour` tinyint NOT NULL DEFAULT 0,
  `start_min` tinyint UNSIGNED NOT NULL DEFAULT 0,
  `start_sec` tinyint UNSIGNED NOT NULL DEFAULT 0,
  `start_csec` tinyint UNSIGNED NOT NULL DEFAULT 0,
  `end_hour` tinyint NOT NULL DEFAULT 0,
  `end_min` tinyint UNSIGNED NOT NULL DEFAULT 0,
  `end_sec` tinyint UNSIGNED NOT NULL DEFAULT 0,
  `end_csec` tinyint UNSIGNED NOT NULL DEFAULT 0,
  `style` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `effect` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `B_ass_id` mediumint NOT NULL,
  PRIMARY KEY (`primary_key`) USING BTREE,
  INDEX `B_ass_id`(`B_ass_id`) USING BTREE,
  FULLTEXT INDEX `text`(`text`) WITH PARSER `ngram`
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for ass_file
-- ----------------------------
DROP TABLE IF EXISTS `ass_file`;
CREATE TABLE `ass_file`  (
  `ass_id` mediumint UNSIGNED NOT NULL AUTO_INCREMENT,
  `year` year NOT NULL,
  `date` date NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sub_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ep_sort` tinyint UNSIGNED NOT NULL DEFAULT 0,
  `B_ep_id` mediumint UNSIGNED NOT NULL,
  `R_bangumi_id` mediumint UNSIGNED NOT NULL,
  `V_path` varchar(511) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (concat(`year`,_utf8mb4'\\(',date_format(`date`,_utf8mb4'%Y.%c.%e'),_utf8mb4')',`name`,_utf8mb4'\\',`source`,_utf8mb4'\\',`sub_name`,_utf8mb4'\\',`file_name`)) VIRTUAL NOT NUL) NOT NULL,
  PRIMARY KEY (`ass_id`) USING BTREE,
  UNIQUE INDEX `V_path`(`V_path`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for bangumi__type2
-- ----------------------------
DROP TABLE IF EXISTS `bangumi__type2`;
CREATE TABLE `bangumi__type2`  (
  `bangumi_id` int UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_cn` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `officialSite` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `begin` date NOT NULL DEFAULT '1900-01-01',
  `rating_total` smallint UNSIGNED NOT NULL DEFAULT 0,
  `rating_score` decimal(4, 2) NOT NULL DEFAULT 0.00,
  `info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`bangumi_id`) USING BTREE,
  INDEX `begin`(`begin`) USING BTREE,
  FULLTEXT INDEX `name`(`name`, `name_cn`) WITH PARSER `ngram`
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for bangumi_ep
-- ----------------------------
DROP TABLE IF EXISTS `bangumi_ep`;
CREATE TABLE `bangumi_ep`  (
  `ep_id` mediumint UNSIGNED NOT NULL,
  `type` int UNSIGNED NOT NULL,
  `sort` int UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_cn` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_hour` int UNSIGNED NOT NULL,
  `duration_min` int UNSIGNED NOT NULL,
  `duration_sec` int UNSIGNED NOT NULL,
  `airdate` date NOT NULL,
  `desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `B_bangumi_id` mediumint UNSIGNED NOT NULL,
  PRIMARY KEY (`ep_id`) USING BTREE,
  INDEX `airdate`(`airdate`, `sort`) USING BTREE,
  INDEX `B_bangumi_id`(`B_bangumi_id`, `sort`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for bgm_character
-- ----------------------------
DROP TABLE IF EXISTS `bgm_character`;
CREATE TABLE `bgm_character`  (
  `character_id` int UNSIGNED NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_cn` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cover` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`character_id`) USING BTREE,
  FULLTEXT INDEX `name`(`name`, `name_cn`) WITH PARSER `ngram`
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for bgm_person__cv
-- ----------------------------
DROP TABLE IF EXISTS `bgm_person__cv`;
CREATE TABLE `bgm_person__cv`  (
  `person_id` mediumint NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_cn` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cover` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`person_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for bgm-crt-cv
-- ----------------------------
DROP TABLE IF EXISTS `bgm-crt-cv`;
CREATE TABLE `bgm-crt-cv`  (
  `primary_key` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `bangumi_id` mediumint UNSIGNED NOT NULL,
  `character_id` mediumint UNSIGNED NOT NULL,
  `person_id` mediumint UNSIGNED NOT NULL,
  PRIMARY KEY (`primary_key`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
