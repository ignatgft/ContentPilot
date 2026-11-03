package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.MenuPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuPlanItemRepository extends JpaRepository<MenuPlanItem, Long> {
    List<MenuPlanItem> findByMenuPlanId(Long menuPlanId);
}
