package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.ForecastLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForecastLineRepository extends JpaRepository<ForecastLine, Long> {
    List<ForecastLine> findByForecastRunId(Long forecastRunId);
}
