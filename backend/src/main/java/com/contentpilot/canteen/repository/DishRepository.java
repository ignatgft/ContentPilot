package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.Dish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DishRepository extends JpaRepository<Dish, Long> {
    List<Dish> findBySchoolIdAndActiveTrue(Long schoolId);
    List<Dish> findBySchoolId(Long schoolId);
}
