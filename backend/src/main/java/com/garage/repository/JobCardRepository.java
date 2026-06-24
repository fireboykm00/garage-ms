package com.garage.repository;

import com.garage.model.JobCard;
import com.garage.model.enums.JobCardStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobCardRepository extends JpaRepository<JobCard, Long> {
    boolean existsByJobNumber(String jobNumber);
    List<JobCard> findAllByOrderByCreatedAtDesc();
    long countByStatus(JobCardStatus status);
    @Query("SELECT COUNT(j) FROM JobCard j WHERE j.status = 'COMPLETED' AND CAST(j.updatedAt AS date) = CURRENT_DATE")
    long countCompletedToday();
    List<JobCard> findTop5ByOrderByCreatedAtDesc();
    @Query("SELECT j FROM JobCard j WHERE j.customerPhone = :phone OR j.vehicleRegistration = :vehicle ORDER BY j.createdAt DESC")
    List<JobCard> findByCustomerPhoneOrVehicleRegistrationOrderByCreatedAtDesc(String phone, String vehicle);
    List<JobCard> findByVehicleRegistrationOrderByCreatedAtDesc(String vehicleRegistration);
    List<JobCard> findByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);
}
