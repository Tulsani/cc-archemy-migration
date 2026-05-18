-- Optional RDS-safe routines and view from the original Archemy dump.
-- This file intentionally omits local DEFINER clauses such as root@localhost.

DROP PROCEDURE IF EXISTS `insert_into_kad`;
DROP PROCEDURE IF EXISTS `insert_into_kad_dim_area`;
DROP VIEW IF EXISTS `pcg`;

DELIMITER ;;

CREATE PROCEDURE `insert_into_kad`(
  IN kad_name varchar(100),
  IN kad_link varchar(300),
  IN kad_public_link varchar(300),
  IN domain_id int(11),
  IN business_problem int,
  OUT kad_id int(11)
)
BEGIN
  INSERT INTO `kads` (
    `KAD_NAME`,
    `DOMAIN_ID`,
    `KAD_LINK`,
    `KAD_LINK_PUBLIC`,
    `RECURRING_BUS_PROBLEM_ID`
  )
  VALUES (
    kad_name,
    domain_id,
    kad_link,
    kad_public_link,
    business_problem
  );

  SELECT LAST_INSERT_ID() INTO kad_id;
END ;;

CREATE PROCEDURE `insert_into_kad_dim_area`(
  IN in_kad_id int,
  IN in_area_id int,
  IN in_area_child_id int,
  IN in_dimension_id int
)
BEGIN
  INSERT INTO `kad_dimensions_area` (
    `KAD_ID`,
    `DIMENSION_ID`,
    `AREA_ID`,
    `AREA_PARENT_ID`
  )
  VALUES (
    in_kad_id,
    in_dimension_id,
    in_area_child_id,
    in_area_id
  );
END ;;

DELIMITER ;

CREATE VIEW `pcg` AS
SELECT
  `d`.`DIMENSION_NAME` AS `dimension_name`,
  `a`.`AREA_NAME` AS `Parent`,
  `c`.`AREA_NAME` AS `Child`,
  `g`.`AREA_NAME` AS `Grandchild`
FROM `dimensions` `d`
LEFT JOIN `areas` `a`
  ON `a`.`DIMENSION_ID` = `d`.`DIMENSION_ID`
 AND `a`.`AREA_DEPTH_LEVEL` = 0
LEFT JOIN `areas` `c`
  ON `c`.`AREA_PARENT_ID` = `a`.`AREA_ID`
 AND `c`.`AREA_DEPTH_LEVEL` = 1
LEFT JOIN `areas` `g`
  ON `g`.`AREA_PARENT_ID` = `c`.`AREA_ID`
 AND `g`.`AREA_DEPTH_LEVEL` = 2
ORDER BY
  `d`.`DIMENSION_ID`,
  `a`.`AREA_ORDER_NO`,
  `c`.`AREA_ORDER_NO`,
  `g`.`AREA_ORDER_NO`;
